import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, UserCog, MapPin, Award, Star, Briefcase, Wrench, CalendarClock, CircleSlash } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../components/ui/sheet';
import { Skeleton } from '../../../components/ui/skeleton';
import { notify } from '../../../lib/notify';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { getProductSummary, getDeviceLabel } from '../../../utils/customerRequestPresentation';
import { getWorkStatusLabel, getWorkStatusTone, formatRecommendationReasons, getServiceAreaLabel, getIneligibleReasonLabels } from '../../../utils/adminPresentation';
import { formatPickupSlot } from '../../../utils/pickupSlots';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { getAssignmentErrorMessage } from '../../../utils/assignmentErrorMessage';
import { useAdminAttention, adminAttentionKeys } from '../../../hooks/useAdminAttention';
import { inviteTechnician } from '../../../api/jobPortal';
import { attentionIdSets, flagsFor, ATTENTION_FLAGS } from '../../../utils/attentionPresentation';
import { Select } from '../../../components/ui/select';

const EMPTY_REQUESTS = [];
const VIEW_OPTIONS = [
    { value: 'all', label: 'All waiting requests' },
    { value: 'overdue', label: 'Pickup time passed' },
    { value: 'unmatched', label: 'No local technician' },
    { value: 'unchosen', label: 'Nobody chosen in 24h' },
];

// Badges for a waiting request that needs attention (overdue-alerts phase).
function AttentionBadges({ flags }) {
    if (flags.length === 0) return null;
    return (
        <span className="mt-1 flex flex-wrap gap-1">
            {flags.map((flag) => <Badge key={flag} tone={ATTENTION_FLAGS[flag].tone}>{ATTENTION_FLAGS[flag].label}</Badge>)}
        </span>
    );
}

// Phase 7.5: technician assignment rebuilt around the EXPERTISE-AWARE backend.
// The assignment Sheet uses the authoritative eligible-technicians endpoint
// (GET /repair-requests/:id/eligible-technicians) - only server-eligible, server-ranked
// technicians can be assigned, with the server's own recommendation reasons.
// Its diagnostic mode also lists everyone else as "Not available" with the
// server's reasons (wrong device or repair, level, busy, other region). No
// client-side suitability scoring. Assignment still goes through the existing
// PATCH /repair-requests/:id (which re-validates eligibility server-side); no business
// logic changes.
const AssignTechnicians = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useUrlFilters({ q: '', view: 'all' });
    const search = filters.q;
    const view = VIEW_OPTIONS.some((o) => o.value === filters.view) ? filters.view : 'all';
    // Overdue / no-local-technician flags from GET /admin/attention. Optional:
    // without it the page works as before, just without badges.
    const attentionQuery = useAdminAttention();
    const attentionSets = useMemo(() => (attentionQuery.data ? attentionIdSets(attentionQuery.data) : null), [attentionQuery.data]);
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
        queryFn: async () => (await axiosSecure.get(`/repair-requests/${selectedRequest._id}/eligible-technicians`, { params: { diagnostic: 'true' } })).data,
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
        if (view !== 'all' && !(attentionSets && attentionSets[view].has(r._id))) return false;
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return getDeviceLabel(r).toLowerCase().includes(term) || (r.senderDistrict || r.serviceLocation?.district || '').toLowerCase().includes(term);
    }), [requests, search, view, attentionSets]);

    // Job portal (phase B): a request with a photo is open for applications -
    // the normal way is to invite a technician to apply, so the customer
    // chooses. Direct assignment stays as an admin override.
    const openForApplications = Boolean(selectedRequest) && selectedRequest.schemaVersion === 2 && (selectedRequest.damage?.imageCount ?? 0) > 0;
    const [invited, setInvited] = useState(() => new Set());
    const [invitingId, setInvitingId] = useState(null);
    // Remembered per request and technician, for this page visit.
    const inviteKey = (technicianId) => `${selectedRequest?._id}|${technicianId}`;
    const handleInvite = (technician) => {
        if (!selectedRequest || invitingId) return;
        setInvitingId(technician.technicianId);
        inviteTechnician(axiosSecure, selectedRequest._id, technician.technicianId)
            .then(() => {
                setInvited((current) => new Set(current).add(inviteKey(technician.technicianId)));
                notify.success(`${technician.displayName} has been invited to apply.`);
            })
            .catch((error) => {
                const code = error?.response?.data?.code;
                if (code === 'ALREADY_INVITED') setInvited((current) => new Set(current).add(inviteKey(technician.technicianId)));
                notify.error(code === 'ALREADY_INVITED' ? 'Already invited.' : code === 'JOB_NOT_OPEN' ? 'This request is no longer open for applications.' : 'The invitation could not be sent. Please try again.');
            })
            .finally(() => setInvitingId(null));
    };

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
                    queryClient.invalidateQueries({ queryKey: adminAttentionKeys.all });
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
            accessorFn: (row) => getDeviceLabel(row),
            cell: ({ row }) => {
                const { device, category } = getProductSummary(row.original);
                return (
                    <div className="min-w-0">
                        <div className="truncate font-medium text-ds-foreground">{device}</div>
                        {category && <div className="truncate text-xs text-ds-muted-foreground">{category}</div>}
                        <AttentionBadges flags={flagsFor(row.original._id, attentionSets)} />
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
        {
            id: 'pickup', header: 'Pickup', enableSorting: true,
            // Unscheduled (older) requests sort last.
            accessorFn: (row) => (row.pickupSlot?.startsAt ? new Date(row.pickupSlot.startsAt).getTime() : Number.MAX_SAFE_INTEGER),
            cell: ({ row }) => <span className="whitespace-nowrap">{formatPickupSlot(row.original.pickupSlot) || <span className="text-ds-muted-foreground">Not scheduled</span>}</span>,
            meta: { label: 'Pickup' },
        },
        { id: 'created', header: 'Requested', enableSorting: false, cell: ({ row }) => <span className="whitespace-nowrap text-ds-muted-foreground">{row.original.createdAt ? formatAbsoluteDateTime(row.original.createdAt) : ''}</span>, meta: { label: 'Requested' } },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="primary" size="sm" onClick={() => setSelectedRequest(row.original)}><UserCog aria-hidden="true" />Find technicians</Button>
                </div>
            ),
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], [attentionSets]);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Assign technicians" />
                <ErrorState title="Couldn't load requests" description="We couldn't load requests awaiting assignment right now. Please try again." onRetry={retryPendingRequests} />
            </div>
        );
    }

    const summary = hasUsableEligibleTechnicians ? eligibleQuery.data.requestSummary : undefined;
    const eligibleTechnicians = hasUsableEligibleTechnicians ? eligibleQuery.data.technicians : [];
    // Applicants who are not approved yet are not technicians, so they are
    // left out. Closest matches (fewest reasons) first.
    const unavailableTechnicians = hasUsableEligibleTechnicians && Array.isArray(eligibleQuery.data.ineligibleTechnicians)
        ? eligibleQuery.data.ineligibleTechnicians
            .filter((tech) => !tech.reasonCodes?.includes('TECHNICIAN_NOT_APPROVED'))
            .sort((a, b) => (a.reasonCodes?.length ?? 0) - (b.reasonCodes?.length ?? 0))
        : [];
    const selectedPickup = formatPickupSlot(selectedRequest?.pickupSlot);

    const renderCard = (request) => {
        const { device, category } = getProductSummary(request);
        return (
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                <p className="ds-label text-ds-warning">Assignment required</p>
                <p className="truncate text-sm font-semibold text-ds-foreground">{device}</p>
                <p className="truncate text-xs text-ds-muted-foreground">{[category, request.senderName].filter(Boolean).join(' · ')}</p>
                <AttentionBadges flags={flagsFor(request._id, attentionSets)} />
                {request.trackingId && <p className="mt-2 break-all font-mono text-xs text-ds-muted-foreground">{request.trackingId}</p>}
                <div className="mt-2 flex items-center gap-2 text-xs text-ds-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {request.senderDistrict || request.serviceLocation?.district || '—'}
                </div>
                {request.pickupSlot && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-ds-muted-foreground">
                        <CalendarClock aria-hidden="true" className="size-3.5" />
                        Pickup {formatPickupSlot(request.pickupSlot)}
                    </div>
                )}
                <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => setSelectedRequest(request)}><UserCog aria-hidden="true" />Find technicians</Button>
                </div>
            </div>
        );
    };

    const viewCount = (value) => {
        if (value === 'all' || !attentionSets) return null;
        return requests.filter((r) => attentionSets[value].has(r._id)).length;
    };
    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="assign-search" className="sr-only">Search requests</Label>
                <Input id="assign-search" type="search" value={search} onChange={(e) => setFilters({ q: e.target.value })} placeholder="Search by device or district" className="pl-9" />
            </div>
            <Label htmlFor="assign-view" className="sr-only">Show</Label>
            <Select id="assign-view" size="sm" value={view} onChange={(e) => setFilters({ view: e.target.value })} wrapperClassName="sm:w-60">
                {VIEW_OPTIONS.map((o) => {
                    const count = viewCount(o.value);
                    return <option key={o.value} value={o.value}>{count === null ? o.label : `${o.label} (${count})`}</option>;
                })}
            </Select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Assign technicians"
                description={isInitialLoading
                    ? 'Loading requests awaiting assignment…'
                    : requests.length > 0
                        ? `${requests.length} request${requests.length === 1 ? '' : 's'} need${requests.length === 1 ? 's' : ''} a technician. Only technicians Sarabo matches as eligible are offered.`
                        : 'No requests are waiting for a technician.'}
            />
            <AdminDataTable
                caption="Repair requests awaiting a technician"
                columns={columns}
                data={filtered}
                isLoading={isInitialLoading}
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                emptyState={
                    <EmptyState
                        title={search || view !== 'all' ? 'No matching requests' : 'Nothing to assign'}
                        description={view === 'overdue' ? 'No waiting request has passed its pickup time.'
                            : view === 'unmatched' ? 'Every waiting request has at least one technician in its region who can take it.'
                            : search ? 'No requests match your search.' : 'No repair requests are waiting for technician assignment right now.'}
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
                            {selectedPickup ? ` · Pickup ${selectedPickup}` : ''}
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
                                headingLevel={3}
                            />
                        ) : eligibleTechnicians.length === 0 ? (
                            <EmptyState title="No eligible technicians" description="No available technician in this region matches this request's device and repair. The reasons for each technician are listed below." headingLevel={3} />
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
                                            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                                                {openForApplications && (
                                                    <Button size="sm" variant="primary" disabled={!!assigningId || invited.has(inviteKey(tech.technicianId)) || invitingId === tech.technicianId} onClick={() => handleInvite(tech)}>
                                                        {invited.has(inviteKey(tech.technicianId)) ? 'Invited' : invitingId === tech.technicianId ? 'Inviting…' : 'Invite to apply'}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant={openForApplications ? 'outline' : 'primary'} disabled={!!assigningId} onClick={() => handleAssign(tech)}>
                                                    {assigningId === tech.technicianId ? 'Assigning…' : openForApplications ? 'Assign directly' : 'Assign'}
                                                </Button>
                                            </div>
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

                        {unavailableTechnicians.length > 0 && (
                            <section aria-labelledby="unavailable-technicians-heading" className="mt-6">
                                <h3 id="unavailable-technicians-heading" className="text-body-sm font-bold text-ds-foreground">
                                    Not available ({unavailableTechnicians.length})
                                </h3>
                                <p className="mt-0.5 text-micro text-ds-muted-foreground">These technicians can't take this request.</p>
                                <ul className="mt-3 space-y-2">
                                    {unavailableTechnicians.map((tech) => (
                                        <li key={tech.technicianId} className="rounded-ds-lg border border-ds-border bg-ds-muted/40 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="min-w-0 truncate text-body-sm font-medium text-ds-foreground">{tech.displayName || 'Unnamed technician'}</p>
                                                <Badge tone="neutral"><CircleSlash aria-hidden="true" />Not available</Badge>
                                            </div>
                                            <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Reasons">
                                                {getIneligibleReasonLabels(tech).map((label) => (
                                                    <li key={label}><Badge tone="attention">{label}</Badge></li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AssignTechnicians;
