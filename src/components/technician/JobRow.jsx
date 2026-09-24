import { createElement } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary, getRequestStatus } from '../../utils/customerRequestPresentation';
import { getTechnicianAttention, getJobLocation } from '../../utils/technicianJobPresentation';
import { getProductCategoryIcon } from '../../utils/productCategoryIcons';
import { formatRelativeTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// One assigned job in the queue or the Assigned Jobs list (Phase 4): device,
// what it needs, a short meta line, and one action. Jobs that need the
// technician get the Marigold edge; everything else stays quiet. Replaces the
// older TechnicianJobItem / TechnicianActiveJob / CompletedJobItem trio.
// `children` (optional) renders under the meta line - Completed jobs uses it
// for the earnings line.
function JobRow({ job, onAdvance, pending, children }) {
    const { device, category } = getProductSummary(job);
    const status = getRequestStatus(job);
    const attention = getTechnicianAttention(job);
    const location = getJobLocation(job);
    const detailsTo = `/dashboard/assigned-jobs/${job._id}`;
    const busy = pending?.id === job._id;
    const needsYou = attention.kind === 'action';
    const headingId = `job-${job._id}`;

    const action = attention.action?.kind === 'advance' ? (
        <Button variant={needsYou ? 'primary' : 'outline'} onClick={() => onAdvance(job, attention.action.nextStatus)} disabled={busy} className="flex-1 sm:flex-none">
            {busy ? 'Updating…' : attention.action.label}
        </Button>
    ) : (
        <Link to={attention.action?.to || detailsTo} className={cn(buttonVariants({ variant: needsYou ? 'primary' : 'outline' }), 'flex-1 sm:flex-none')}>
            {attention.action?.label || 'Open'}
            <ArrowRight aria-hidden="true" />
        </Link>
    );

    return (
        <Card className={cn('transition-colors hover:border-ds-primary/40', needsYou && 'border-l-4 border-l-ds-action')}>
            <article aria-labelledby={headingId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-ds-lg bg-ds-muted text-ds-foreground sm:flex">
                    {createElement(getProductCategoryIcon(job?.product?.categorySlug), { 'aria-hidden': true, className: 'size-6' })}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 id={headingId} className="min-w-0 break-words text-subhead">
                            <Link to={detailsTo} className="focus-ring rounded-ds-sm text-ds-foreground hover:text-ds-primary">{device}</Link>
                        </h3>
                        <StatusBadge audience="technician" status={status} showIcon={false} />
                    </div>
                    {attention.description && <p className="text-body-sm text-ds-muted-foreground">{attention.description}</p>}
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-ds-muted-foreground">
                        {category && <span>{category}</span>}
                        {location && <span>{location}</span>}
                        {job.trackingId && <span className="ds-numeric">{job.trackingId}</span>}
                        {job.updatedAt && <span>Updated {formatRelativeTime(job.updatedAt)}</span>}
                    </p>
                    {children}
                </div>
                <div className="flex shrink-0 items-center">{action}</div>
            </article>
        </Card>
    );
}

export { JobRow };
