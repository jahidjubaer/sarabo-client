import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, MapPin, Send, Users } from 'lucide-react';
import { useJobPortal, jobPortalKeys } from '../../../hooks/useJobPortal';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import DamageImageManager from '../../../components/damage-images/DamageImageManager';
import { JobApplicationSheet } from '../../../components/technician/JobApplicationSheet';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../../utils/currency';
import { formatPickupSlot } from '../../../utils/pickupSlots';
import { formatRelativeTime } from '../../../utils/relativeTime';

function jobTitle(job) {
    const named = [job.product.brand, job.product.model].filter(Boolean).join(' ');
    return named || humanizeSlug(job.product.categorySlug);
}

function JobCard({ job, onApply }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const mine = job.myApplication;
    const applied = mine?.status === 'pending';
    const headingId = `job-${job.id}-title`;
    return (
        <Card className="p-5" aria-labelledby={headingId}>
            <article className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-micro font-semibold text-ds-muted-foreground">{humanizeSlug(job.product.categorySlug)} · {humanizeSlug(job.repairCategorySlug)}</p>
                        <h2 id={headingId} className="text-subhead text-ds-foreground">{job.title}</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {job.invited && <Badge tone="info">Invited by Sarabo</Badge>}
                        {applied && <Badge tone="success">Applied</Badge>}
                        {job.otherApplications > 0 && <Badge tone="neutral"><Users aria-hidden="true" />{job.otherApplications} other{job.otherApplications === 1 ? '' : 's'} applied</Badge>}
                    </div>
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ds-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{job.district}, {job.region}</span>
                    {job.pickupSlot && <span className="inline-flex items-center gap-1.5"><CalendarClock aria-hidden="true" className="size-4" />Pickup {formatPickupSlot(job.pickupSlot)}</span>}
                    {job.publishedAt && <span>Posted {formatRelativeTime(job.publishedAt)}</span>}
                </p>
                {job.problem && <p className="text-body-sm text-ds-foreground">“{job.problem}”</p>}
                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm">
                    <div><dt className="inline text-ds-muted-foreground">Usual price </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(job.catalogueEstimate.min, job.catalogueEstimate.max, job.catalogueEstimate.currency)}</dd></div>
                    <div><dt className="inline text-ds-muted-foreground">Inspection fee up to </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoney(job.maxInspectionFee, 'BDT')}</dd></div>
                    {applied && (
                        <div><dt className="inline text-ds-muted-foreground">Your estimate </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(mine.estimateMin, mine.estimateMax, 'BDT')} · fee {formatMoney(mine.inspectionFee, 'BDT')}</dd></div>
                    )}
                </dl>
                <div className="flex flex-wrap gap-2">
                    <Button variant={applied ? 'outline' : 'action'} onClick={() => onApply(job)}>
                        <Send aria-hidden="true" /> {applied ? 'Update or withdraw' : 'Apply'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowPhotos((v) => !v)} aria-expanded={showPhotos}>
                        <Camera aria-hidden="true" /> {showPhotos ? 'Hide photos' : `View photos (${job.photoCount})`}
                    </Button>
                </div>
                {showPhotos && <div className="border-t border-ds-border pt-3"><DamageImageManager requestId={job.id} canEdit={false} /></div>}
            </article>
        </Card>
    );
}

// Job portal (job-portal phase B): open repair requests this technician can
// take - their region, devices, repairs and level - with photos. The customer
// compares applications and chooses; nothing here books a job directly.
const JobPortal = () => {
    const queryClient = useQueryClient();
    const { data, isPending, isPaused, isError } = useJobPortal();
    // The sheet keeps its job while it animates closed.
    const [sheet, setSheet] = useState({ open: false, job: null });
    const jobs = (data?.jobs ?? []).map((job) => ({ ...job, title: jobTitle(job) }));
    const header = (
        <PageHeader
            title="Job portal"
            description="Open repairs in your region that match your expertise. Apply with an estimate and your inspection fee; the customer chooses."
        />
    );

    if (!data && (isError || isPaused)) {
        return (
            <div className="space-y-6">
                {header}
                <ErrorState title="Couldn't load open jobs" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: jobPortalKeys.portal })} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {header}
            {isPending && !isPaused ? (
                <div className="space-y-4">{[0, 1, 2].map((k) => <Skeleton key={k} className="h-48 w-full" />)}</div>
            ) : jobs.length === 0 ? (
                <EmptyState title="No open jobs for you right now" description="New repair requests in your region for the repairs you do will appear here." />
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => <JobCard key={job.id} job={job} onApply={(picked) => setSheet({ open: true, job: picked })} />)}
                </div>
            )}
            <JobApplicationSheet open={sheet.open} onOpenChange={(open) => setSheet((current) => ({ ...current, open }))} job={sheet.job} />
        </div>
    );
};

export default JobPortal;
