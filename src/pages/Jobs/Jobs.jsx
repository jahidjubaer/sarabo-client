import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, Search, SlidersHorizontal, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { useJobPortal, useOpenJobs, jobPortalKeys } from '../../hooks/useJobPortal';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import SectionHeader from '../../components/public/SectionHeader';
import { JobCard } from '../../components/technician/JobCard';
import { JobApplicationSheet } from '../../components/technician/JobApplicationSheet';
import DamageImageManager from '../../components/damage-images/DamageImageManager';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { buttonVariants } from '../../components/ui/button-variants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import {
    jobTitle, toBoardJob, jobFilterOptions, filterJobs, sortJobs, countActiveJobFilters, JOB_SORTS, JOB_FILTER_DEFAULTS,
} from '../../utils/jobBoard';
import { cn } from '../../lib/utils';

function JobsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((k) => <Skeleton key={k} className="h-96 w-full rounded-ds-xl" />)}
            <span role="status" className="sr-only">Loading open jobs…</span>
        </div>
    );
}

function FilterSelect({ id, label, value, onChange, children }) {
    return (
        <div className="min-w-0 space-y-1">
            <label htmlFor={id} className="text-micro font-semibold text-ds-muted-foreground">{label}</label>
            <Select id={id} size="sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</Select>
        </div>
    );
}

function Chip({ pressed, onClick, children }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'focus-ring inline-flex h-9 items-center rounded-full border px-3.5 text-body-sm font-semibold transition-colors',
                pressed ? 'border-ds-primary bg-ds-primary text-ds-primary-foreground' : 'border-ds-border bg-ds-card text-ds-foreground hover:border-ds-input'
            )}
        >
            {children}
        </button>
    );
}

// Search, filters and sort, kept in the URL so a refresh or shared link keeps them.
function JobFilters({ filters, setFilters, options, isTechnician, shown, total }) {
    const active = countActiveJobFilters(filters);
    // Below sm the selects fold away so the jobs show first.
    const [expanded, setExpanded] = useState(false);
    const folded = active - (filters.q.trim() ? 1 : 0) + (filters.sort !== 'newest' ? 1 : 0);
    const clear = () => setFilters({ q: '', region: 'all', device: 'all', repair: 'all', offers: 'all', mine: 'all' });
    return (
        <div className="space-y-3 rounded-ds-xl border border-ds-border bg-ds-card p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
                <div className="min-w-0 space-y-1 sm:col-span-2 lg:col-span-1">
                    <label htmlFor="jobs-search" className="text-micro font-semibold text-ds-muted-foreground">Search</label>
                    <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                        <Input
                            id="jobs-search"
                            type="search"
                            value={filters.q}
                            onChange={(event) => setFilters({ q: event.target.value })}
                            placeholder="Brand, district, repair…"
                            className="h-9 pl-9 text-body-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="sm:hidden"
                        aria-expanded={expanded}
                        aria-controls="jobs-more-filters"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        <SlidersHorizontal aria-hidden="true" />Filters{folded > 0 ? ` (${folded})` : ''}
                    </Button>
                    </div>
                </div>
                <div id="jobs-more-filters" className={cn('contents', !expanded && 'max-sm:hidden')}>
                <FilterSelect id="jobs-region" label="Region" value={filters.region} onChange={(region) => setFilters({ region })}>
                    <option value="all">All regions</option>
                    {options.regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </FilterSelect>
                <FilterSelect id="jobs-device" label="Device" value={filters.device} onChange={(device) => setFilters({ device })}>
                    <option value="all">All devices</option>
                    {options.devices.map((d) => <option key={d} value={d}>{humanizeSlug(d)}</option>)}
                </FilterSelect>
                <FilterSelect id="jobs-repair" label="Repair" value={filters.repair} onChange={(repair) => setFilters({ repair })}>
                    <option value="all">All repairs</option>
                    {options.repairs.map((r) => <option key={r} value={r}>{humanizeSlug(r)}</option>)}
                </FilterSelect>
                <FilterSelect id="jobs-sort" label="Sort by" value={filters.sort} onChange={(sort) => setFilters({ sort })}>
                    {JOB_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FilterSelect>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="hidden size-4 text-ds-muted-foreground sm:block" />
                <Chip pressed={filters.offers === 'none'} onClick={() => setFilters({ offers: filters.offers === 'none' ? 'all' : 'none' })}>No offers yet</Chip>
                {isTechnician && (
                    <>
                        <Chip pressed={filters.mine === 'not-applied'} onClick={() => setFilters({ mine: filters.mine === 'not-applied' ? 'all' : 'not-applied' })}>Not applied</Chip>
                        <Chip pressed={filters.mine === 'applied'} onClick={() => setFilters({ mine: filters.mine === 'applied' ? 'all' : 'applied' })}>My offers</Chip>
                    </>
                )}
                <p className="ml-auto text-body-sm text-ds-muted-foreground" role="status">
                    {shown === total ? `${total} job${total === 1 ? '' : 's'}` : `${shown} of ${total} jobs`}
                </p>
                {active > 0 && (
                    <Button variant="ghost" size="sm" onClick={clear}><X aria-hidden="true" />Clear filters</Button>
                )}
            </div>
        </div>
    );
}

// The grid, shared by both boards.
function JobGrid({ jobs, mode, filters, setFilters, isTechnician, emptyTitle, emptyDescription, onApply, onPhotos }) {
    const options = useMemo(() => jobFilterOptions(jobs), [jobs]);
    const visible = useMemo(() => sortJobs(filterJobs(jobs, filters), filters.sort), [jobs, filters]);
    if (jobs.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;
    return (
        <div className="space-y-5">
            <JobFilters filters={filters} setFilters={setFilters} options={options} isTechnician={isTechnician} shown={visible.length} total={jobs.length} />
            {visible.length === 0 ? (
                <EmptyState title="No jobs match these filters" description="Try another region or device, or clear the filters." />
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Open jobs">
                    {visible.map((job) => <li key={job.id}><JobCard job={job} mode={mode} onApply={onApply} onPhotos={onPhotos} /></li>)}
                </ul>
            )}
        </div>
    );
}

// Signed-in technicians: the jobs they can take, with details and photos.
function TechnicianBoard({ filters, setFilters }) {
    const queryClient = useQueryClient();
    const { data, isPending, isPaused, isError } = useJobPortal();
    // Both keep their job while they animate closed.
    const [sheet, setSheet] = useState({ open: false, job: null });
    const [photos, setPhotos] = useState({ open: false, job: null });
    const jobs = useMemo(() => (data?.jobs ?? []).map(toBoardJob), [data]);

    if (!data && (isError || isPaused)) {
        return <ErrorState title="Couldn't load open jobs" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: jobPortalKeys.portal })} />;
    }
    if (isPending && !isPaused) return <JobsSkeleton />;
    return (
        <>
            <JobGrid
                jobs={jobs}
                mode="technician"
                isTechnician
                filters={filters}
                setFilters={setFilters}
                emptyTitle="No open jobs for you right now"
                emptyDescription="New repair requests in your region for the repairs you do appear here - you'll get a notification too."
                onApply={(job) => setSheet({ open: true, job: { ...job.raw, title: jobTitle(job.raw) } })}
                onPhotos={(job) => setPhotos({ open: true, job })}
            />
            <JobApplicationSheet open={sheet.open} onOpenChange={(open) => setSheet((current) => ({ ...current, open }))} job={sheet.job} />
            <Dialog open={photos.open} onOpenChange={(open) => setPhotos((current) => ({ ...current, open }))}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Customer's photos</DialogTitle>
                        <DialogDescription>{photos.job ? `${humanizeSlug(photos.job.repairSlug)} · ${photos.job.district}` : ''}</DialogDescription>
                    </DialogHeader>
                    {photos.open && photos.job && <DamageImageManager requestId={photos.job.id} canEdit={false} />}
                </DialogContent>
            </Dialog>
        </>
    );
}

// Everyone else: the public summary, and how to start applying.
function PublicBoard({ signedIn, filters, setFilters }) {
    const queryClient = useQueryClient();
    const { data, isPending, isPaused, isError } = useOpenJobs();
    const jobs = useMemo(() => (data?.jobs ?? []).map(toBoardJob), [data]);
    return (
        <div className="space-y-6">
            {!signedIn && (
                <div className="flex flex-col gap-3 rounded-ds-xl bg-ds-ink p-5 text-ds-ink-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-body-sm">Are you a Sarabo technician? Sign in to see the problem, the customer's photos and the pickup time, and send your offer.</p>
                    <Link to="/login" state="/jobs" className={cn(buttonVariants({ variant: 'action' }), 'shrink-0')}><LogIn aria-hidden="true" />Sign in to apply</Link>
                </div>
            )}
            {!data && (isError || isPaused) ? (
                <ErrorState title="Couldn't load open jobs" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: jobPortalKeys.openJobs })} />
            ) : isPending && !isPaused ? <JobsSkeleton /> : (
                <JobGrid
                    jobs={jobs}
                    mode={signedIn ? 'member' : 'guest'}
                    isTechnician={false}
                    filters={filters}
                    setFilters={setFilters}
                    emptyTitle="No open jobs right now"
                    emptyDescription="New repair requests appear here as customers post them."
                />
            )}
        </div>
    );
}

// Open jobs board (/jobs, outside the dashboard). Customers' repair requests
// appear here once they have a photo. Technicians send an estimate and an
// inspection fee; the customer accepts one or rejects it, which reposts the
// request here. Cards show the device photo; the customer's own photos are
// only shown to signed-in technicians.
const Jobs = () => {
    const { user, loading } = useAuth();
    const { role, roleLoading } = useRole();
    const [filters, setFilters] = useUrlFilters(JOB_FILTER_DEFAULTS);
    const resolving = loading || (user && roleLoading);
    const isTechnician = Boolean(user) && role === 'rider';

    return (
        <div>
            <header className="px-4 pb-4 pt-12 sm:px-6 lg:px-8 lg:pt-20">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader
                        as="h1"
                        id="page-title"
                        eyebrow="Open jobs"
                        title="Repair jobs waiting for a technician"
                        description="Send your estimate and inspection fee. The customer compares offers and chooses one - or rejects it, and the job is posted again."
                    />
                </div>
            </header>
            <section aria-labelledby="page-title" className="px-4 pb-20 pt-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    {resolving ? <JobsSkeleton /> : isTechnician
                        ? <TechnicianBoard filters={filters} setFilters={setFilters} />
                        : <PublicBoard signedIn={Boolean(user)} filters={filters} setFilters={setFilters} />}
                </div>
            </section>
        </div>
    );
};

export default Jobs;
