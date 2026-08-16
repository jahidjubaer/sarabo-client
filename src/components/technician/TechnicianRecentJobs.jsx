import { Link } from 'react-router';
import { ArrowRight, ChevronRight, Hash, MapPin } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { getJobLocation, getTechnicianAttention } from '../../utils/technicianJobPresentation';
import { formatAbsoluteDateTime, formatRelativeTime } from '../../utils/relativeTime';

// Secondary queue preview for the Technician dashboard. These are links only;
// the focused job remains the sole source of a primary operational action.
function TechnicianRecentJobs({ jobs }) {
    if (!jobs || jobs.length === 0) return null;

    return (
        <Card>
            <div className="flex items-center justify-between gap-2 border-b border-ds-border px-5 py-3">
                <h2 className="text-sm font-semibold text-ds-foreground">Remaining jobs</h2>
                <Link to="/dashboard/assigned-jobs" className="focus-ring inline-flex items-center gap-1 rounded-ds text-sm font-medium text-ds-primary hover:underline">
                    View all
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <CardContent className="p-0">
                <ul className="divide-y divide-ds-border">
                    {jobs.map((job) => {
                        const { device, category } = getProductSummary(job);
                        const location = getJobLocation(job);
                        const attention = getTechnicianAttention(job);
                        return (
                            <li key={job._id}>
                                <Link
                                    to={`/dashboard/assigned-jobs/${job._id}`}
                                    className="focus-ring flex items-start gap-3 px-5 py-4 hover:bg-ds-muted/50"
                                >
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center">
                                            <p className="break-words text-sm font-semibold text-ds-foreground">{device}</p>
                                            <StatusBadge status={job.deliveryStatus} showIcon={false} />
                                        </div>
                                        <p className="text-xs font-medium text-ds-foreground">{attention.title}</p>
                                        <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-ds-muted-foreground">
                                            {category && <span>{category}</span>}
                                            {location && (
                                                <span className="inline-flex min-w-0 items-start gap-1">
                                                    <MapPin aria-hidden="true" className="mt-px size-3 shrink-0" />
                                                    <span className="break-words">{location}</span>
                                                </span>
                                            )}
                                            <span title={formatAbsoluteDateTime(job.createdAt)}>{formatRelativeTime(job.createdAt)}</span>
                                        </p>
                                        {job.trackingId && (
                                            <p className="flex min-w-0 items-start gap-1 font-mono text-[11px] text-ds-muted-foreground">
                                                <Hash aria-hidden="true" className="mt-px size-3 shrink-0" />
                                                <span className="break-all">{job.trackingId}</span>
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-ds-muted-foreground" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}

export { TechnicianRecentJobs };
