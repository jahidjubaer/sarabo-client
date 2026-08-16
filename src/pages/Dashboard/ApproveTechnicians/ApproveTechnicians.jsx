import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Check, X, Eye, Search } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../components/ui/sheet';
import { notify } from '../../../lib/notify';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { getWorkStatusLabel, getWorkStatusTone, getExpertiseBadges, isTechnicianMatchable } from '../../../utils/adminPresentation';
import { getTechnicianApprovalErrorMessage } from '../../../utils/technicianApprovalErrorMessage';

const selectClass = "h-10 rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring";
const EMPTY_TECHNICIANS = [];

const APPLICATION_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };
function ApplicationBadge({ status }) {
    return <Badge tone={APPLICATION_TONE[status] || 'neutral'}>{status ? humanizeSlug(status) : 'Unknown'}</Badge>;
}
function ExpertiseBadges({ technician }) {
    const badges = getExpertiseBadges(technician);
    const matchable = isTechnicianMatchable(technician);
    if (badges.length === 0) {
        return matchable
            ? <span className="text-xs text-ds-muted-foreground">—</span>
            : <Badge tone="warning">Incomplete matching profile</Badge>;
    }
    return (
        <div className="flex flex-wrap gap-1">
            {badges.map((badge) => (
                <Badge key={badge.key} tone="neutral">{badge.label}{badge.level ? ` · ${badge.level}` : ''}</Badge>
            ))}
            {!matchable && <Badge tone="warning">Incomplete matching profile</Badge>}
        </div>
    );
}

// Phase 8.9: full per-specialization expertise breakdown for the admin details
// Sheet - product/device category, its repair-category labels, expertise level,
// and experience years, all from canonical stored data and rendered through the
// service-definition humanizer (never raw slugs). Admin-only surface.
function TechnicianExpertiseDetails({ technician }) {
    const expertise = Array.isArray(technician?.expertise) ? technician.expertise : [];
    const entries = expertise.filter((entry) => entry && entry.productCategorySlug);
    if (entries.length === 0) return <span className="text-xs text-ds-muted-foreground">—</span>;
    return (
        <ul className="space-y-2">
            {entries.map((entry) => (
                <li key={entry.productCategorySlug} className="rounded-ds border border-ds-border p-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-ds-foreground">{humanizeSlug(entry.productCategorySlug)}</span>
                        {entry.level && <Badge tone="neutral">{humanizeSlug(entry.level)}</Badge>}
                        {Number.isFinite(Number(entry.experienceYears)) && (
                            <span className="text-xs text-ds-muted-foreground">{entry.experienceYears} yr{Number(entry.experienceYears) === 1 ? '' : 's'} experience</span>
                        )}
                    </div>
                    {Array.isArray(entry.repairCategorySlugs) && entry.repairCategorySlugs.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry.repairCategorySlugs.map((slug) => (
                                <Badge key={slug} tone="info">{humanizeSlug(slug)}</Badge>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

// Phase 7.5: technician management on the design-system data table. The
// approve/reject mutation (PATCH /technicians/:id) and its error mapper are
// PRESERVED - only presentation, a details Sheet, expertise badges, and
// Toastify feedback changed. No workStatus is guessed; only stored values shown.
const ApproveTechnicians = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pendingAction, setPendingAction] = useState(null);
    const [detailsFor, setDetailsFor] = useState(null);

    const techniciansQueryKey = ['technicians', 'all'];
    const { refetch, data, isPending, isPaused, isError } = useQuery({
        queryKey: techniciansQueryKey,
        queryFn: async () => (await axiosSecure.get('/technicians')).data,
    });
    const hasUsableTechnicians = Array.isArray(data);
    const technicians = hasUsableTechnicians ? data : EMPTY_TECHNICIANS;
    const isInitialLoading = isPending && !isPaused && !hasUsableTechnicians;
    const isUnavailableBeforeData = !hasUsableTechnicians && (isPaused || isError);
    const retryTechnicians = () => queryClient.resetQueries({ queryKey: techniciansQueryKey });

    const statusOptions = useMemo(() => [...new Set(technicians.map((t) => t.status).filter(Boolean))], [technicians]);

    const filtered = useMemo(() => technicians.filter((tech) => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || (tech.name || '').toLowerCase().includes(term) || (tech.email || '').toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [technicians, search, statusFilter]);

    const updateStatus = (technician, status) => {
        if (pendingAction) return;
        setPendingAction({ id: technician._id, status });
        axiosSecure.patch(`/technicians/${technician._id}`, { status })
            .then(() => {
                refetch();
                notify.success(status === 'approved' ? `${technician.name} approved` : `${technician.name} rejected`);
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Technician status update failed:', error);
                notify.error(getTechnicianApprovalErrorMessage(error));
                refetch();
            })
            .finally(() => setPendingAction(null));
    };

    const columns = useMemo(() => [
        {
            id: 'name', header: 'Technician', enableSorting: true, enableHiding: false,
            accessorFn: (row) => row.name || '',
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-ds-foreground">{row.original.name}</div>
                    <div className="truncate text-xs text-ds-muted-foreground">{row.original.email}</div>
                </div>
            ),
            meta: { label: 'Technician' },
        },
        { id: 'district', header: 'District', enableSorting: true, accessorFn: (row) => row.district || '', cell: ({ row }) => row.original.district || '—', meta: { label: 'District' } },
        { id: 'expertise', header: 'Expertise', enableSorting: false, cell: ({ row }) => <ExpertiseBadges technician={row.original} />, meta: { label: 'Expertise' } },
        { id: 'application', header: 'Application', enableSorting: false, cell: ({ row }) => <ApplicationBadge status={row.original.status} />, meta: { label: 'Application' } },
        { id: 'work', header: 'Work status', enableSorting: false, cell: ({ row }) => <Badge tone={getWorkStatusTone(row.original.workStatus)}>{getWorkStatusLabel(row.original.workStatus)}</Badge>, meta: { label: 'Work status' } },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => {
                const tech = row.original;
                const busy = pendingAction?.id === tech._id;
                const matchable = isTechnicianMatchable(tech);
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`View ${tech.name}`} onClick={() => setDetailsFor(tech)}><Eye aria-hidden="true" className="size-4" /></Button>
                        {tech.status !== 'approved' && (
                            <Button variant="ghost" size="icon" className="text-ds-success hover:text-ds-success"
                                aria-label={matchable ? `Approve ${tech.name}` : `Cannot approve ${tech.name} — incomplete matching profile`}
                                title={matchable ? undefined : 'Incomplete matching profile — expertise and service area must be completed first'}
                                disabled={busy || !matchable} onClick={() => updateStatus(tech, 'approved')}><Check aria-hidden="true" className="size-4" /></Button>
                        )}
                        {tech.status !== 'rejected' && (
                            <Button variant="ghost" size="icon" className="text-ds-destructive hover:text-ds-destructive" aria-label={`Reject ${tech.name}`} disabled={busy} onClick={() => updateStatus(tech, 'rejected')}><X aria-hidden="true" className="size-4" /></Button>
                        )}
                    </div>
                );
            },
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [pendingAction]);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Admin" title="Technicians" />
                <ErrorState title="Couldn't load technicians" description="We couldn't load the technician list right now. Please try again." onRetry={retryTechnicians} />
            </div>
        );
    }

    const renderCard = (tech) => {
        const busy = pendingAction?.id === tech._id;
        const matchable = isTechnicianMatchable(tech);
        return (
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ds-foreground">{tech.name}</p>
                        <p className="truncate text-xs text-ds-muted-foreground">{tech.email}</p>
                    </div>
                    <ApplicationBadge status={tech.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ds-muted-foreground">
                    <span>{tech.district || '—'}</span>
                    <Badge tone={getWorkStatusTone(tech.workStatus)}>{getWorkStatusLabel(tech.workStatus)}</Badge>
                </div>
                <div className="mt-2"><ExpertiseBadges technician={tech} /></div>
                {!matchable && tech.status !== 'approved' && (
                    <p className="mt-2 text-xs text-ds-muted-foreground">Complete the expertise and service area before approving.</p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailsFor(tech)}><Eye aria-hidden="true" />View</Button>
                    {tech.status !== 'approved' && <Button size="sm" disabled={busy || !matchable} title={matchable ? undefined : 'Incomplete matching profile'} onClick={() => updateStatus(tech, 'approved')}><Check aria-hidden="true" />Approve</Button>}
                    {tech.status !== 'rejected' && <Button variant="outline" size="sm" className="text-ds-destructive hover:text-ds-destructive" disabled={busy} onClick={() => updateStatus(tech, 'rejected')}><X aria-hidden="true" />Reject</Button>}
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="tech-search" className="sr-only">Search technicians</Label>
                <Input id="tech-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-9" />
            </div>
            <Label htmlFor="tech-status" className="sr-only">Filter by application status</Label>
            <select id="tech-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All applications</option>
                {statusOptions.map((s) => <option key={s} value={s}>{humanizeSlug(s)}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Admin" title="Technicians" description={isInitialLoading ? 'Loading technician applications...' : `${technicians.length} technician application${technicians.length === 1 ? '' : 's'}`} />
            <AdminDataTable
                columns={columns}
                data={filtered}
                isLoading={isInitialLoading}
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                enableColumnVisibility
                emptyState={
                    <EmptyState
                        title={search || statusFilter !== 'all' ? 'No matching technicians' : 'No technician applications'}
                        description={search || statusFilter !== 'all' ? 'No technicians match your search or filter.' : 'Technician applications will appear here for review.'}
                    />
                }
            />

            <Sheet open={!!detailsFor} onOpenChange={(open) => { if (!open) setDetailsFor(null); }}>
                <SheetContent side="right" className="w-full max-w-md">
                    <SheetHeader className="border-b border-ds-border">
                        <SheetTitle>{detailsFor?.name}</SheetTitle>
                        <SheetDescription>Technician application details</SheetDescription>
                    </SheetHeader>
                    {detailsFor && (
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                            {[
                                ['Email', detailsFor.email],
                                ['Region', detailsFor.region],
                                ['District', detailsFor.district],
                                ['Address', detailsFor.address],
                                ['Skills / specialization', detailsFor.license],
                                ['National ID', detailsFor.nid],
                                ['Experience', detailsFor.bike],
                            ].map(([label, value]) => (
                                <div key={label} className="grid grid-cols-3 gap-2">
                                    <dt className="text-ds-muted-foreground">{label}</dt>
                                    <dd className="col-span-2 break-words text-ds-foreground">{value || '—'}</dd>
                                </div>
                            ))}
                            <div className="grid grid-cols-3 gap-2">
                                <dt className="text-ds-muted-foreground">Application</dt>
                                <dd className="col-span-2"><ApplicationBadge status={detailsFor.status} /></dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <dt className="text-ds-muted-foreground">Work status</dt>
                                <dd className="col-span-2"><Badge tone={getWorkStatusTone(detailsFor.workStatus)}>{getWorkStatusLabel(detailsFor.workStatus)}</Badge></dd>
                            </div>
                            <div className="space-y-1.5">
                                <dt className="text-ds-muted-foreground">Expertise</dt>
                                <dd><TechnicianExpertiseDetails technician={detailsFor} /></dd>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ApproveTechnicians;
