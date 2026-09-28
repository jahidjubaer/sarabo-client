import { useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LogIn, MapPin, RotateCcw, Users, Wrench } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { useJobPortal, useOpenJobs, jobPortalKeys } from '../../hooks/useJobPortal';
import SectionHeader from '../../components/public/SectionHeader';
import { JobCard } from '../../components/technician/JobCard';
import { JobApplicationSheet } from '../../components/technician/JobApplicationSheet';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { buttonVariants } from '../../components/ui/button-variants';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoneyRange } from '../../utils/currency';
import { formatPickupDate } from '../../utils/pickupSlots';
import { formatRelativeTime } from '../../utils/relativeTime';
import { jobTitle } from '../../utils/jobBoard';
import { BECOME_TECHNICIAN_ROUTE } from '../../utils/publicContent';

// A safe summary for anyone: no problem text, photos or address.
function PublicJobCard({ job }) {
    const headingId = `open-job-${job.id}`;
    return (
        <Card className="p-5" aria-labelledby={headingId}>
            <article className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-micro font-semibold text-ds-muted-foreground">{humanizeSlug(job.product.categorySlug)}</p>
                        <h2 id={headingId} className="text-subhead text-ds-foreground">{humanizeSlug(job.repairCategorySlug)}{job.product.brand ? ` · ${job.product.brand}` : ''}</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {job.reposted && <Badge tone="neutral"><RotateCcw aria-hidden="true" />Reposted</Badge>}
                        <Badge tone={job.offers > 0 ? 'neutral' : 'active'}><Users aria-hidden="true" />{job.offers > 0 ? `${job.offers} offer${job.offers === 1 ? '' : 's'}` : 'No offers yet'}</Badge>
                    </div>
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ds-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{job.district}, {job.region}</span>
                    {job.pickupDate && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />Pickup {formatPickupDate(job.pickupDate)}</span>}
                    {job.postedAt && <span>{job.reposted ? 'Reposted' : 'Posted'} {formatRelativeTime(job.postedAt)}</span>}
                </p>
                <p className="text-body-sm">
                    <span className="text-ds-muted-foreground">Usual price </span>
                    <span className="ds-numeric font-semibold text-ds-foreground">{formatMoneyRange(job.catalogueEstimate.min, job.catalogueEstimate.max, job.catalogueEstimate.currency)}</span>
                </p>
            </article>
        </Card>
    );
}

function JobsSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((k) => <Skeleton key={k} className="h-40 w-full" />)}
            <span role="status" className="sr-only">Loading open jobs…</span>
        </div>
    );
}

// Signed-in technicians: the jobs they can take, with details and photos.
function TechnicianBoard() {
    const queryClient = useQueryClient();
    const { data, isPending, isPaused, isError } = useJobPortal();
    // The sheet keeps its job while it animates closed.
    const [sheet, setSheet] = useState({ open: false, job: null });
    const jobs = (data?.jobs ?? []).map((job) => ({ ...job, title: jobTitle(job) }));

    if (!data && (isError || isPaused)) {
        return <ErrorState title="Couldn't load open jobs" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: jobPortalKeys.portal })} />;
    }
    return (
        <>
            {isPending && !isPaused ? <JobsSkeleton /> : jobs.length === 0 ? (
                <EmptyState title="No open jobs for you right now" description="New repair requests in your region for the repairs you do appear here." />
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => <JobCard key={job.id} job={job} onApply={(picked) => setSheet({ open: true, job: picked })} />)}
                </div>
            )}
            <JobApplicationSheet open={sheet.open} onOpenChange={(open) => setSheet((current) => ({ ...current, open }))} job={sheet.job} />
        </>
    );
}

// Everyone else: the public summary, and how to start applying.
function PublicBoard({ signedIn }) {
    const queryClient = useQueryClient();
    const { data, isPending, isPaused, isError } = useOpenJobs();
    const jobs = data?.jobs ?? [];
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-ds-xl border border-ds-border bg-ds-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body-sm text-ds-muted-foreground">
                    {signedIn
                        ? 'Only approved Sarabo technicians can see the full details and send offers.'
                        : 'Are you a Sarabo technician? Sign in to see the problem, photos and pickup time, and send your offer.'}
                </p>
                {signedIn ? (
                    <Link to={BECOME_TECHNICIAN_ROUTE} className={buttonVariants({ variant: 'outline' })}><Wrench aria-hidden="true" />Become a technician</Link>
                ) : (
                    <Link to="/login" state="/jobs" className={buttonVariants({ variant: 'action' })}><LogIn aria-hidden="true" />Sign in to apply</Link>
                )}
            </div>
            {!data && (isError || isPaused) ? (
                <ErrorState title="Couldn't load open jobs" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: jobPortalKeys.openJobs })} />
            ) : isPending && !isPaused ? <JobsSkeleton /> : jobs.length === 0 ? (
                <EmptyState title="No open jobs right now" description="New repair requests appear here as customers post them." />
            ) : (
                <ul className="space-y-4" aria-label="Open jobs">
                    {jobs.map((job) => <li key={job.id}><PublicJobCard job={job} /></li>)}
                </ul>
            )}
        </div>
    );
}

// Open jobs board (/jobs, outside the dashboard). Customers' repair requests
// appear here once they have a photo. Technicians send an estimate and an
// inspection fee; the customer accepts one or rejects it, which reposts the
// request here.
const Jobs = () => {
    const { user, loading } = useAuth();
    const { role, roleLoading } = useRole();
    const resolving = loading || (user && roleLoading);
    const isTechnician = Boolean(user) && role === 'rider';

    return (
        <div>
            <header className="px-4 pb-4 pt-12 sm:px-6 lg:px-8 lg:pt-20">
                <div className="mx-auto max-w-4xl">
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
                <div className="mx-auto max-w-4xl">
                    {resolving ? <JobsSkeleton /> : isTechnician ? <TechnicianBoard /> : <PublicBoard signedIn={Boolean(user)} />}
                </div>
            </section>
        </div>
    );
};

export default Jobs;
