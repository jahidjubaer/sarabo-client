import { Link } from 'react-router';
import { ArrowRight, CalendarDays, CircleAlert, CircleCheckBig, CircleX, Clock3, Hash, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary, getRequestStatus } from '../../utils/customerRequestPresentation';
import { getTechnicianAttention, getJobLocation, getJobGroup } from '../../utils/technicianJobPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// Compact operational row. A real Technician action receives the only
// marigold treatment; waiting and terminal jobs remain informational.
function TechnicianJobItem({ job, onAdvance, pendingAction }) {
    const { device, category, brandModel } = getProductSummary(job);
    const status = getRequestStatus(job);
    const attention = getTechnicianAttention(job);
    const location = getJobLocation(job);
    const detailsTo = `/dashboard/assigned-jobs/${job._id}`;
    const isCompleted = getJobGroup(job) === 'completed';
    const isPending = pendingAction?.id === job._id;
    const ActionIcon = attention.kind === 'action'
        ? CircleAlert
        : attention.kind === 'done'
            ? CircleCheckBig
            : attention.kind === 'blocked'
                ? CircleX
                : Clock3;
    const headingId = `technician-job-${job._id}`;

    const primaryAction = attention.action?.kind === 'advance' ? (
        <Button
            size="sm"
            variant="action"
            onClick={() => onAdvance(job, attention.action.nextStatus)}
            disabled={isPending}
        >
            {isPending ? 'Updating...' : attention.action.label}
        </Button>
    ) : attention.action ? (
        <Link to={attention.action.to} className={buttonVariants({ variant: 'action', size: 'sm' })}>
            {attention.action.label}
            <ArrowRight aria-hidden="true" />
        </Link>
    ) : null;

    return (
        <Card className={cn('overflow-hidden', isCompleted && 'bg-ds-muted/20')}>
            <article aria-labelledby={headingId}>
                <div className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <StatusBadge status={status} />
                            <div>
                                <h3 id={headingId} className="break-words text-base font-semibold text-ds-foreground">{device}</h3>
                                {(category || brandModel) && (
                                    <p className="mt-0.5 break-words text-sm text-ds-muted-foreground">
                                        {[category, brandModel].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ds-muted-foreground">
                            <CalendarDays aria-hidden="true" className="size-3.5" />
                            {formatAbsoluteDateTime(job.createdAt)}
                        </span>
                    </div>

                    <div className={cn(
                        'flex items-start gap-2 rounded-ds border p-3',
                        attention.kind === 'action'
                            ? 'border-ds-warning/30 bg-ds-warning/5'
                            : 'border-ds-border bg-ds-muted/25'
                    )}>
                        <ActionIcon
                            aria-hidden="true"
                            className={cn('mt-0.5 size-4 shrink-0', attention.kind === 'action' ? 'text-ds-warning' : 'text-ds-muted-foreground')}
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-ds-foreground">{attention.title}</p>
                            {attention.description && <p className="mt-0.5 text-xs text-ds-muted-foreground">{attention.description}</p>}
                        </div>
                    </div>

                    <div className="grid gap-2 text-xs text-ds-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        {job.trackingId && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <Hash aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                                <span className="break-all font-mono text-ds-foreground">{job.trackingId}</span>
                            </span>
                        )}
                        {location && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <MapPin aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                                <span className="break-words">{location}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-ds-border bg-ds-muted/20 px-4 py-3 sm:px-5">
                    {primaryAction}
                    <Link
                        to={detailsTo}
                        className={buttonVariants({ variant: primaryAction ? 'outline' : 'default', size: 'sm' })}
                    >
                        View details
                        {!primaryAction && <ArrowRight aria-hidden="true" />}
                    </Link>
                </div>
            </article>
        </Card>
    );
}

export { TechnicianJobItem };
