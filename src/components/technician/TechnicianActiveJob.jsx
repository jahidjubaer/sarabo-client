import { Link } from 'react-router';
import {
    ArrowRight,
    CalendarDays,
    CircleAlert,
    CircleCheckBig,
    CircleX,
    Clock3,
    Hash,
    MapPin,
    Package,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import ServiceSpine from '../spine/ServiceSpine';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { getTechnicianAttention, getJobLocation } from '../../utils/technicianJobPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

const ATTENTION_TONES = {
    action: {
        wrap: 'border-ds-warning/40 bg-ds-warning/5',
        icon: 'bg-ds-warning/15 text-ds-warning',
        Icon: CircleAlert,
    },
    waiting: {
        wrap: 'border-ds-primary/25 bg-ds-primary/5',
        icon: 'bg-ds-primary/10 text-ds-primary',
        Icon: Clock3,
    },
    done: {
        wrap: 'border-ds-success/30 bg-ds-success/5',
        icon: 'bg-ds-success/10 text-ds-success',
        Icon: CircleCheckBig,
    },
    blocked: {
        wrap: 'border-ds-border bg-ds-muted/30',
        icon: 'bg-ds-muted text-ds-muted-foreground',
        Icon: CircleX,
    },
};

// Focused Technician job: one authoritative operational action leads, while
// identity, lifecycle, tracking and location remain supporting context.
function TechnicianActiveJob({ job, onAdvance, pendingAction, className }) {
    if (!job) return null;

    const { device, category, brandModel } = getProductSummary(job);
    const attention = getTechnicianAttention(job);
    const tone = ATTENTION_TONES[attention.kind];
    const Icon = tone.Icon;
    const location = getJobLocation(job);
    const detailsTo = `/dashboard/assigned-jobs/${job._id}`;
    const isPending = pendingAction?.id === job._id;

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
        <Card className={cn('overflow-hidden', attention.kind === 'action' ? 'border-ds-warning/40' : 'border-ds-primary/25', className)}>
            <CardContent className="p-0">
                <div className={cn('border-b border-ds-border px-5 py-5 sm:px-6', tone.wrap)}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full', tone.icon)}>
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="ds-label text-ds-muted-foreground">{attention.eyebrow}</p>
                                <h3 className="mt-1 break-words text-xl font-semibold tracking-tight text-ds-foreground">{attention.title}</h3>
                                {attention.description && (
                                    <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">{attention.description}</p>
                                )}
                            </div>
                        </div>
                        <StatusBadge status={job.deliveryStatus} className="self-start" />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 min-[390px]:flex-row min-[390px]:items-center">
                        {primaryAction}
                        <Link
                            to={detailsTo}
                            className={buttonVariants({ variant: primaryAction ? 'outline' : 'default', size: 'sm' })}
                        >
                            View job details
                            {!primaryAction && <ArrowRight aria-hidden="true" />}
                        </Link>
                    </div>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div className="flex items-start gap-3">
                        <Package aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                        <div className="min-w-0">
                            <p className="break-words font-semibold text-ds-foreground">{device}</p>
                            {(category || brandModel) && (
                                <p className="mt-0.5 break-words text-sm text-ds-muted-foreground">
                                    {[category, brandModel].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="mb-3 ds-label text-ds-muted-foreground">Service spine</p>
                        <ServiceSpine request={job} />
                    </div>

                    <div className="grid gap-2 border-t border-ds-border pt-4 text-sm text-ds-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        {job.trackingId && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <Hash aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                <span className="min-w-0 break-all font-mono text-xs text-ds-foreground">{job.trackingId}</span>
                            </span>
                        )}
                        {location && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                <span className="break-words">{location}</span>
                            </span>
                        )}
                        <span className="inline-flex items-start gap-1.5">
                            <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            <span>Assigned {formatAbsoluteDateTime(job.createdAt)}</span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { TechnicianActiveJob };
