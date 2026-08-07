import { Link } from 'react-router';
import { ArrowRight, CalendarDays, MapPin, Wrench } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { getTechnicianAction, getJobLocation } from '../../utils/technicianJobPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// Prominent current/next job for the technician. The CTA either advances the
// generic status (early stages, via the preserved mutation) or opens the
// details screen; no customer PII beyond an operational district/region, and
// no ids/schemaVersion/storage internals are shown.
function TechnicianActiveJob({ job, onAdvance, pendingAction, className }) {
    if (!job) return null;

    const { device, category, brandModel } = getProductSummary(job);
    const presentation = getStatusPresentation(job.deliveryStatus);
    const action = getTechnicianAction(job);
    const location = getJobLocation(job);
    const detailsTo = `/dashboard/assigned-jobs/${job._id}`;
    const isPending = pendingAction?.id === job._id;

    return (
        <Card className={cn("border-ds-primary/25", className)}>
            <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">Current job</p>
                        <h3 className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-ds-foreground">
                            <Wrench aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                            <span className="truncate">{device}</span>
                        </h3>
                        {(category || brandModel) && (
                            <p className="mt-0.5 truncate text-sm text-ds-muted-foreground">{[category, brandModel].filter(Boolean).join(' · ')}</p>
                        )}
                    </div>
                    <StatusBadge status={job.deliveryStatus} className="shrink-0" />
                </div>

                {presentation.technicianDescription && (
                    <p className="text-sm text-ds-foreground">
                        {presentation.technicianDescription}
                        {presentation.technicianNextStep ? ` ${presentation.technicianNextStep}` : ''}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ds-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="size-4" />
                        Assigned {formatAbsoluteDateTime(job.createdAt)}
                    </span>
                    {location && (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin aria-hidden="true" className="size-4" />
                            {location}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {action.kind === 'advance' ? (
                        <>
                            <Button size="sm" onClick={() => onAdvance(job, action.nextStatus)} disabled={isPending}>
                                {isPending ? 'Updating...' : action.label}
                            </Button>
                            <Link to={detailsTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>View details</Link>
                        </>
                    ) : (
                        <Link to={action.to} className={buttonVariants({ variant: action.variant, size: 'sm' })}>
                            {action.label}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export { TechnicianActiveJob };
