import { Link } from 'react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { formatRelativeTime, formatAbsoluteDateTime } from '../../utils/relativeTime';

// Short, glanceable list of the customer's latest requests (not a full table).
// Each row links to the request's detail page; a "View all" link leads to the
// full My Requests page.
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
                                    className="focus-ring flex items-center gap-3 px-5 py-3 hover:bg-ds-muted/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-ds-foreground">{device}</p>
                                        <p className="truncate text-xs text-ds-muted-foreground">
                                            {category && `${category} · `}
                                            <span title={formatAbsoluteDateTime(request.createdAt)}>{formatRelativeTime(request.createdAt)}</span>
                                        </p>
                                    </div>
                                    <StatusBadge status={request.deliveryStatus} showIcon={false} className="shrink-0" />
                                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ds-muted-foreground" />
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
