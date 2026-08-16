import { Link } from 'react-router';
import { ArrowRight, ChevronRight, Hash } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { formatRelativeTime, formatAbsoluteDateTime } from '../../utils/relativeTime';

// Secondary history on the Customer dashboard. Rows remain fully linked, but
// their quieter treatment keeps them below the focused next-action surface.
function RecentRequests({ requests }) {
    if (!requests || requests.length === 0) return null;

    return (
        <Card>
            <div className="flex items-center justify-between gap-2 border-b border-ds-border px-5 py-3">
                <h2 className="text-sm font-semibold text-ds-foreground">Recent requests</h2>
                <Link to="/dashboard/my-requests" className="focus-ring inline-flex items-center gap-1 rounded-ds text-sm font-medium text-ds-primary hover:underline">
                    View all
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <CardContent className="p-0">
                <ul className="divide-y divide-ds-border">
                    {requests.map((request) => {
                        const { device, category } = getProductSummary(request);
                        return (
                            <li key={request._id}>
                                <Link
                                    to={`/dashboard/my-requests/${request._id}`}
                                    className="focus-ring flex items-start gap-3 px-5 py-4 hover:bg-ds-muted/50"
                                >
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center">
                                            <p className="break-words text-sm font-semibold text-ds-foreground">{device}</p>
                                            <StatusBadge status={request.deliveryStatus} showIcon={false} />
                                        </div>
                                        <p className="text-xs text-ds-muted-foreground">
                                            {category && <span>{category} · </span>}
                                            <span title={formatAbsoluteDateTime(request.createdAt)}>{formatRelativeTime(request.createdAt)}</span>
                                        </p>
                                        {request.trackingId && (
                                            <p className="flex min-w-0 items-start gap-1 font-mono text-[11px] text-ds-muted-foreground">
                                                <Hash aria-hidden="true" className="mt-px size-3 shrink-0" />
                                                <span className="break-all">{request.trackingId}</span>
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

export { RecentRequests };
