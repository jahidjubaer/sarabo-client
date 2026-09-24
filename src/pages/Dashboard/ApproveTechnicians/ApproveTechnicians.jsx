import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Check, X, Search } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from '../../../components/ui/sheet';
import { notify } from '../../../lib/notify';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { getWorkStatusLabel, getWorkStatusTone, getExpertiseBadges, isTechnicianMatchable } from '../../../utils/adminPresentation';
import { getTechnicianApprovalErrorMessage } from '../../../utils/technicianApprovalErrorMessage';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Select } from '../../../components/ui/select';

const EMPTY_TECHNICIANS = [];

function ApplicationBadge({ status }) {
    return <StatusBadge domain="application" status={status} audience="admin" />;
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
    // A truthful unavailable state, not a bare dash: an application with no
    // recorded expertise cannot be matched to any repair, and that is exactly
    // what an admin needs to know before approving it (Phase 9.2).
    if (entries.length === 0) {
        return <span className="text-xs italic text-ds-muted-foreground">No specialisations recorded</span>;
    }
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

// Technician applications (Phase 5). The approve/reject mutation
// (PATCH /technicians/:id) and its error mapper are unchanged. What changed:
// a decision is made from the details sheet, with the applicant's expertise
// in view, and each one is confirmed first - approve and reject used to fire
// from a single icon click in the table. Filters live in the URL. No
// workStatus is guessed; only stored values are shown.
const ApproveTechnicians = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useUrlFilters({ q: '', status: 'all' });
    const search = filters.q;
    const statusFilter = filters.status;
    const [pendingAction, setPendingAction] = useState(null);
    // The sheet follows the record by id, so it shows the refreshed status
    // after a decision instead of a stale copy.
    const [detailsId, setDetailsId] = useState(null);
    const [decision, setDecision] = useState(null);

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

    // Includes the URL's status even when no record has it right now, so a
    // linked filter (e.g. ?status=pending from the operations home) still
    // shows its own option instead of a blank select.
    const statusOptions = useMemo(() => [...new Set([
        ...technicians.map((t) => t.status),
        statusFilter !== 'all' ? statusFilter : null,
    ].filter(Boolean))], [technicians, statusFilter]);

    const filtered = useMemo(() => technicians.filter((tech) => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || (tech.name || '').toLowerCase().includes(term) || (tech.email || '').toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [technicians, search, statusFilter]);
    const pendingApplicationCount = technicians.filter((technician) => technician.status === 'pending').length;
    const detailsFor = detailsId ? technicians.find((technician) => technician._id === detailsId) || null : null;

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
            .finally(() => { setPendingAction(null); setDecision(null); });
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
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant={row.original.status === 'pending' ? 'primary' : 'outline'}
                        size="sm"
                        aria-label={`${row.original.status === 'pending' ? 'Review application from' : 'View'} ${row.original.name}`}
                        onClick={() => setDetailsId(row.original._id)}
                    >
                        {row.original.status === 'pending' ? 'Review' : 'View'}
                    </Button>
                </div>
            ),
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], []);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Technicians" />
                <ErrorState title="Couldn't load technicians" description="We couldn't load the technician list right now. Please try again." onRetry={retryTechnicians} />
            </div>
        );
    }

    const renderCard = (tech) => (
        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-body-sm font-bold text-ds-foreground">{tech.name}</p>
                    <p className="truncate text-micro text-ds-muted-foreground">{tech.email}</p>
                </div>
                <ApplicationBadge status={tech.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-micro text-ds-muted-foreground">
                <span>{tech.district || '—'}</span>
                <Badge tone={getWorkStatusTone(tech.workStatus)}>{getWorkStatusLabel(tech.workStatus)}</Badge>
            </div>
            <div className="mt-2"><ExpertiseBadges technician={tech} /></div>
            <div className="mt-3 flex justify-end">
                <Button variant={tech.status === 'pending' ? 'primary' : 'outline'} size="sm" onClick={() => setDetailsId(tech._id)}>
                    {tech.status === 'pending' ? 'Review application' : 'View details'}
                </Button>
            </div>
        </div>
    );

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="tech-search" className="sr-only">Search technicians</Label>
                <Input id="tech-search" type="search" value={search} onChange={(e) => setFilters({ q: e.target.value })} placeholder="Search by name or email" className="pl-9" />
            </div>
            <Label htmlFor="tech-status" className="sr-only">Filter by application status</Label>
            <Select id="tech-status" value={statusFilter} onChange={(e) => setFilters({ status: e.target.value })} size="sm" wrapperClassName="sm:w-52">
                <option value="all">All applications</option>
                {statusOptions.map((s) => <option key={s} value={s}>{humanizeSlug(s)}</option>)}
            </Select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Technicians"
                description={isInitialLoading
                    ? 'Loading technician applications…'
                    : `${technicians.length} technician${technicians.length === 1 ? '' : 's'} · ${pendingApplicationCount > 0 ? `${pendingApplicationCount} application${pendingApplicationCount === 1 ? '' : 's'} to review` : 'no applications to review'}`}
            />
            <AdminDataTable
                caption="Technicians and their applications"
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

            <Sheet open={!!detailsFor} onOpenChange={(open) => { if (!open && !pendingAction) setDetailsId(null); }}>
                <SheetContent side="right" className="w-full max-w-md">
                    <SheetHeader className="border-b border-ds-border">
                        <SheetTitle>{detailsFor?.name}</SheetTitle>
                        <SheetDescription>{detailsFor?.status === 'pending' ? 'Check the expertise and service area, then decide.' : 'Technician details'}</SheetDescription>
                    </SheetHeader>
                    {detailsFor && (
                        <dl className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-body-sm">
                            {[
                                ['Email', detailsFor.email],
                                ['Region', detailsFor.region],
                                ['District', detailsFor.district],
                                ['Address', detailsFor.address],
                                ['Phone', detailsFor.phone],
                                ['National ID', detailsFor.nid],
                                // REMOVED (Phase 9.2): 'Skills / specialization'
                                // and 'Experience' rows, which read `license`
                                // and `bike` - courier-era fields that never
                                // held any technician skill or experience data,
                                // so both always rendered a bare "—" while the
                                // real values sat in the Expertise block below.
                                // An admin reading "Skills: —" on an applicant
                                // who HAS recorded specialisations is worse than
                                // showing nothing at all. Expertise is the one
                                // canonical source for both.
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
                        </dl>
                    )}
                    {detailsFor && (
                        <SheetFooter className="border-t border-ds-border">
                            {detailsFor.status !== 'approved' && !isTechnicianMatchable(detailsFor) && (
                                <p className="text-micro text-ds-muted-foreground">Can't approve yet: the applicant's expertise and service area must be complete.</p>
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                {detailsFor.status !== 'rejected' && (
                                    <Button variant="destructiveGhost" disabled={!!pendingAction} onClick={() => setDecision({ tech: detailsFor, status: 'rejected' })}>
                                        <X aria-hidden="true" />{detailsFor.status === 'approved' ? 'Revoke approval' : 'Reject'}
                                    </Button>
                                )}
                                {detailsFor.status !== 'approved' && (
                                    <Button variant="primary" disabled={!!pendingAction || !isTechnicianMatchable(detailsFor)} onClick={() => setDecision({ tech: detailsFor, status: 'approved' })}>
                                        <Check aria-hidden="true" />Approve
                                    </Button>
                                )}
                            </div>
                        </SheetFooter>
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={!!decision}
                onOpenChange={(open) => { if (!open && !pendingAction) setDecision(null); }}
                title={decision?.status === 'approved' ? `Approve ${decision?.tech.name}?` : `Reject ${decision?.tech.name}?`}
                description={decision?.status === 'approved'
                    ? 'They can then be matched to repair requests in their service area.'
                    : 'They will not be offered any repair requests. You can approve them later.'}
                confirmLabel={decision?.status === 'approved' ? 'Approve technician' : 'Reject application'}
                destructive={decision?.status === 'rejected'}
                busy={!!pendingAction}
                onConfirm={() => updateStatus(decision.tech, decision.status)}
            />
        </div>
    );
};

export default ApproveTechnicians;
