import { Link } from 'react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary, getRequestStatus } from '../../utils/customerRequestPresentation';
import { getTechnicianAction, getJobLocation, getJobGroup } from '../../utils/technicianJobPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// One assigned job as an operational card. The primary CTA is status-driven:
// for the two early legacy stages it ADVANCES the delivery status via the
// preserved mutation (onAdvance); for everything else it NAVIGATES to the
// authoritative details screen. Never mutates inspection/quote/repair here.
// Completed jobs are rendered with reduced emphasis but stay fully accessible.
function TechnicianJobItem({ job, onAdvance, pendingAction }) {
    const { device, category, brandModel } = getProductSummary(job);
    const status = getRequestStatus(job);
    const presentation = getStatusPresentation(status);
    const action = getTechnicianAction(job);
    const location = getJobLocation(job);
    const detailsTo = `/dashboard/assigned-jobs/${job._id}`;
    const isCompleted = getJobGroup(job) === 'completed';
    const isPending = pendingAction?.id === job._id;

    return (
        <Card className={cn("p-4", isCompleted && "bg-ds-muted/30")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className={cn("truncate text-sm font-semibold", isCompleted ? "text-ds-muted-foreground" : "text-ds-foreground")}>{device}</h3>
                        <StatusBadge status={status} />
                    </div>
                    {(category || brandModel) && (
                        <p className="truncate text-sm text-ds-muted-foreground">{[category, brandModel].filter(Boolean).join(' · ')}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ds-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays aria-hidden="true" className="size-3.5" />
                            {formatAbsoluteDateTime(job.createdAt)}
                        </span>
                        {location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin aria-hidden="true" className="size-3.5" />
                                {location}
                            </span>
                        )}
                    </div>
                    {presentation.technicianNextStep && !isCompleted && (
                        <p className="text-xs font-medium text-ds-foreground">{presentation.technicianNextStep}</p>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {action.kind === 'advance' ? (
                        <>
                            <Button size="sm" onClick={() => onAdvance(job, action.nextStatus)} disabled={isPending}>
                                {isPending ? 'Updating...' : action.label}
                            </Button>
                            <Link to={detailsTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Details</Link>
                        </>
                    ) : (
                        <Link to={action.to} className={buttonVariants({ variant: action.variant, size: 'sm' })}>{action.label}</Link>
                    )}
                </div>
            </div>
        </Card>
    );
}

export { TechnicianJobItem };
