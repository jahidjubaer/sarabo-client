import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, UserCog, MapPin, Award, Star, Briefcase, Wrench } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { AdminPageLead } from '../../../components/admin/AdminPageLead';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../components/ui/sheet';
import { Skeleton } from '../../../components/ui/skeleton';
import { notify } from '../../../lib/notify';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { getProductSummary } from '../../../utils/customerRequestPresentation';
import { getWorkStatusLabel, getWorkStatusTone, formatRecommendationReasons, getServiceAreaLabel } from '../../../utils/adminPresentation';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { getAssignmentErrorMessage } from '../../../utils/assignmentErrorMessage';

const EMPTY_REQUESTS = [];

// Phase 7.5: technician assignment rebuilt around the EXPERTISE-AWARE backend.
// The assignment Sheet uses the authoritative eligible-technicians endpoint
// (GET /repair-requests/:id/eligible-technicians) - only server-eligible, server-ranked
// technicians are shown, with the server's own recommendation reasons. No
// client-side suitability scoring. Assignment still goes through the existing
// PATCH /repair-requests/:id (which re-validates eligibility server-side); no business
// logic changes.
const AssignTechnicians = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const preselectRequestId = searchParams.get('request');
    const [autoOpenedFor, setAutoOpenedFor] = useState(null);

    const pendingRequestsQueryKey = ['requests', 'pending-assignment'];
    const { data: requestsData, refetch: refetchRequests, isPending, isPaused, isError } = useQuery({
        queryKey: pendingRequestsQueryKey,
        queryFn: async () => (await axiosSecure.get('/repair-requests?deliveryStatus=pending-pickup')).data,
    });
    const hasUsableRequests = Array.isArray(requestsData);
    const requests = hasUsableRequests ? requestsData : EMPTY_REQUESTS;
    const isInitialLoading = isPending && !isPaused && !hasUsableRequests;
    const isUnavailableBeforeData = !hasUsableRequests && (isPaused || isError);
    const retryPendingRequests = () => queryClient.resetQueries({ queryKey: pendingRequestsQueryKey });

    const eligibleTechniciansQueryKey = ['eligible-technicians', selectedRequest?._id];
    const eligibleQuery = useQuery({
        queryKey: eligibleTechniciansQueryKey,
        enabled: !!selectedRequest?._id,
        queryFn: async () => (await axiosSecure.get(`/repair-requests/${selectedRequest._id}/eligible-technicians`)).data,
    });
    const hasUsableEligibleTechnicians = Array.isArray(eligibleQuery.data?.technicians);
    const isEligibleInitialLoading = eligibleQuery.isPending && !eligibleQuery.isPaused && !hasUsableEligibleTechnicians;
    const isEligibleUnavailableBeforeData = !hasUsableEligibleTechnicians && (eligibleQuery.isPaused || eligibleQuery.isError);
    const retryEligibleTechnicians = () => queryClient.resetQueries({ queryKey: eligibleTechniciansQueryKey });

    // Preserved deep-link: open the assignment Sheet once for ?request=<id> if
    // that request is actually still pending assignment.
    useEffect(() => {
        if (!hasUsableRequests || !preselectRequestId || autoOpenedFor === preselectRequestId) return;
        const match = requests.find((r) => r._id === preselectRequestId);
        if (match) setSelectedRequest(match);
        setAutoOpenedFor(preselectRequestId);
        setSearchParams((params) => { params.delete('request'); return params; }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasUsableRequests, requests, preselectRequestId, autoOpenedFor]);

    const filtered = useMemo(() => requests.filter((r) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (r.deviceName || '').toLowerCase().includes(term) || (r.senderDistrict || r.serviceLocation?.district || '').toLowerCase().includes(term);
    }), [requests, search]);

    const handleAssign = (technician) => {
        if (assigningId || !selectedRequest) return;
        setAssigningId(technician.technicianId);
        // Server needs only technicianId (it looks up name/email from the DB and
        // re-validates eligibility); technicianName/trackingId are harmless extras.
        axiosSecure.patch(`/repair-requests/${selectedRequest._id}`, { technicianId: technician.technicianId, technicianName: technician.displayName, trackingId: selectedRequest.trackingId })
            .then((res) => {
                if (res.data.modifiedCount) {
                    setSelectedRequest(null);
                    refetchRequests();
                    queryClient.invalidateQueries({ queryKey: ['request-status-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] });
                    notify.success(`${technician.displayName} offered this assignment — awaiting their decision.`);
                } else {
                    refetchRequests();
                    notify.info('No change was made - the list has been refreshed.');
                }
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Technician assignment failed:', error);
                notify.error(getAssignmentErrorMessage(error));
                refetchRequests();
                eligibleQuery.refetch();
            })
            .finally(() => setAssigningId(null));
    };

    const columns = useMemo(() => [
        {
            id: 'device', header: 'Device', enableSorting: true, enableHiding: false,
            accessorFn: (row) => row.deviceName || '',
            cell: ({ row }) => {
                const { device, category } = getProductSummary(row.original);
                return (
                    <div className="min-w-0">
                        <div className="truncate font-medium text-ds-foreground">{device}</div>
                        {category && <div className="truncate text-xs text-ds-muted-foreground">{category}</div>}
                    </div>
                );
            },
            meta: { label: 'Device' },
        },
        {
            id: 'tracking', header: 'Tracking', enableSorting: false,
            cell: ({ row }) => <span className="break-all font-mono text-xs text-ds-muted-foreground">{row.original.trackingId || '—'}</span>,
            meta: { label: 'Tracking' },
        },
        { id: 'customer', header: 'Customer', enableSorting: false, cell: ({ row }) => <span className="truncate">{row.original.senderName || '—'}</span>, meta: { label: 'Customer' } },
        { id: 'district', header: 'District', enableSorting: true, accessorFn: (row) => row.senderDistrict || row.serviceLocation?.district || '', cell: ({ row }) => row.original.senderDistrict || row.original.serviceLocation?.district || '—', meta: { label: 'District' } },
        { id: 'created', header: 'Requested', enableSorting: false, cell: ({ row }) => <span className="whitespace-nowrap text-ds-muted-foreground">{row.original.createdAt ? formatAbsoluteDateTime(row.original.createdAt) : ''}</span>, meta: { label: 'Requested' } },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => setSelectedRequest(row.original)}><UserCog aria-hidden="true" />Find technicians</Button>
                </div>
            ),
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], []);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Admin" title="Assign Technicians" />
                <ErrorState title="Couldn't load requests" description="We couldn't load requests awaiting assignment right now. Please try again." onRetry={retryPendingRequests} />
            </div>
        );
    }

    const summary = hasUsableEligibleTechnicians ? eligibleQuery.data.requestSummary : undefined;
    const eligibleTechnicians = hasUsableEligibleTechnicians ? eligibleQuery.data.technicians : [];

    const renderCard = (request) => {
        const { device, category } = getProductSummary(request);
        return (
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                <p className="ds-label text-ds-warning">Assignment required</p>
                <p className="truncate text-sm font-semibold text-ds-foreground">{device}</p>
                <p className="truncate text-xs text-ds-muted-foreground">{[category, request.senderName].filter(Boolean).join(' · ')}</p>
                {request.trackingId && <p className="mt-2 break-all font-mono text-xs text-ds-muted-foreground">{request.trackingId}</p>}
                <div className="mt-2 flex items-center gap-2 text-xs text-ds-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {request.senderDistrict || request.serviceLocation?.district || '—'}
                </div>
                <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => setSelectedRequest(request)}><UserCog aria-hidden="true" />Find technicians</Button>
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
            <Label htmlFor="assign-search" className="sr-only">Search requests</Label>
            <Input id="assign-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by device or district" className="pl-9" />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Admin" title="Assign Technicians" description={isInitialLoading ? 'Loading requests awaiting assignment...' : `${requests.length} request${requests.length === 1 ? '' : 's'} awaiting assignment`} />
            <AdminPageLead
                eyebrow="Assignment queue"
                title={isInitialLoading ? 'Checking requests awaiting assignment' : requests.length > 0 ? `${requests.length} request${requests.length === 1 ? '' : 's'} need a Technician` : 'No requests need assignment'}
                description="Open a request, review the existing server-matched Technician list, and assign one eligible Technician."
                icon={UserCog}
                tone={requests.length > 0 ? 'action' : 'clear'}
                metric={isInitialLoading ? undefined : requests.length}
                metricLabel="awaiting assignment"
            />
            <AdminDataTable
                columns={columns}
                data={filtered}
                isLoading={isInitialLoading}
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                emptyState={
                    <EmptyState
                        title={search ? 'No matching requests' : 'Nothing to assign'}
                        description={search ? 'No requests match your search.' : 'No repair requests are waiting for technician assignment right now.'}
                    />
                }
            />

            <Sheet open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
                <SheetContent side="right" className="w-full max-w-lg">
                    <SheetHeader className="border-b border-ds-border">
                        <SheetTitle>Recommended technicians</SheetTitle>
                        <SheetDescription>
                            {selectedRequest ? getProductSummary(selectedRequest).device : ''}
                            {summary?.serviceArea?.district ? ` · ${summary.serviceArea.district}` : ''}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {summary && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {summary.productCategorySlug && <Badge tone="accent">{humanizeSlug(summary.productCategorySlug)}</Badge>}
                                {summary.repairCategorySlug && <Badge tone="neutral">{humanizeSlug(summary.repairCategorySlug)}</Badge>}
                                {summary.requiredExpertiseLevel && <Badge tone="info">Min: {humanizeSlug(summary.requiredExpertiseLevel)}</Badge>}
                            </div>
                        )}

                        {isEligibleInitialLoading ? (
                            <div className="space-y-3">{[0, 1, 2].map((k) => <Skeleton key={k} className="h-24 w-full" />)}</div>
                        ) : isEligibleUnavailableBeforeData ? (
                            <ErrorState
                                title="Couldn't match technicians"
                                description={eligibleQuery.isError ? getAssignmentErrorMessage(eligibleQuery.error) : "We couldn't load eligible technicians right now. Please try again."}
                                onRetry={retryEligibleTechnicians}
                            />
                        ) : eligibleTechnicians.length === 0 ? (
                            <EmptyState title="No eligible technicians" description="No approved, available technician currently matches this request's expertise and service area." />
                        ) : (
                            <ul className="space-y-3">
                                {eligibleTechnicians.map((tech, index) => (
                                    <li key={tech.technicianId} className="rounded-ds-lg border border-ds-border p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-medium text-ds-foreground">{tech.displayName}</p>
                                                    {index === 0 && <Badge tone="success"><Star aria-hidden="true" />Top match</Badge>}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ds-muted-foreground">
                                                    <span className="inline-flex items-center gap-1"><Award aria-hidden="true" className="size-3.5" />{humanizeSlug(tech.expertiseLevel || '')}</span>
                                                    <Badge tone={getWorkStatusTone(tech.workStatus)}>{getWorkStatusLabel(tech.workStatus)}</Badge>
                                                    {tech.serviceAreaMatch?.matchLevel && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="size-3.5" />{getServiceAreaLabel(tech.serviceAreaMatch.matchLevel)}</span>}
                                                    {Number.isFinite(Number(tech.experienceYears)) && (
                                                        <span className="inline-flex items-center gap-1"><Briefcase aria-hidden="true" className="size-3.5" />{tech.experienceYears} yr{Number(tech.experienceYears) === 1 ? '' : 's'} experience</span>
                                                    )}
                                                </div>
                                                {Number.isFinite(Number(tech.completedRepairCount)) && (
                                                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ds-muted-foreground"><Wrench aria-hidden="true" className="size-3.5" />Completed repairs: {tech.completedRepairCount}</p>
                                                )}
                                            </div>
                                            <Button size="sm" className="w-full shrink-0 sm:w-auto" disabled={!!assigningId} onClick={() => handleAssign(tech)}>
                                                {assigningId === tech.technicianId ? 'Assigning…' : 'Assign'}
                                            </Button>
                                        </div>
                                        {Array.isArray(tech.recommendationReasons) && tech.recommendationReasons.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {formatRecommendationReasons(tech.recommendationReasons).map((reason, i) => (
                                                    <Badge key={i} tone="neutral">{reason}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AssignTechnicians;
