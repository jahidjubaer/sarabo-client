import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Package } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getProductSummary, getAgreedPrice, getRequestAction } from '../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// Prominent-but-restrained snapshot of the customer's most relevant in-flight
// repair. All copy comes from the canonical status presentation - no raw
// statuses, ids, technician data, or storage metadata are shown.
function ActiveRepairCard({ request, className }) {
    if (!request) return null;

    const { device, category, brandModel } = getProductSummary(request);
    const presentation = getStatusPresentation(request.deliveryStatus);
    const action = getRequestAction(request);
    const price = getAgreedPrice(request);
    const detailsTo = `/dashboard/my-requests/${request._id}`;

    return (
        <Card className={cn("border-ds-primary/25", className)}>
            <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">Current repair</p>
                        <h3 className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-ds-foreground">
                            <Package aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                            <span className="truncate">{device}</span>
                        </h3>
                        {(category || brandModel) && (
                            <p className="mt-0.5 truncate text-sm text-ds-muted-foreground">
                                {[category, brandModel].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                    <StatusBadge status={request.deliveryStatus} className="shrink-0" />
                </div>

                {presentation.customerDescription && (
                    <p className="text-sm text-ds-foreground">{presentation.customerDescription}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ds-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden="true" className="size-4" />
                        Requested {formatAbsoluteDateTime(request.createdAt)}
                    </span>
                    {price && (
                        <span className="text-ds-foreground">
                            Agreed price: <span className="font-medium">{price}</span>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {action ? (
                        <Link to={action.to} className={buttonVariants({ size: 'sm' })}>
                            {action.label}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    ) : null}
                    <Link to={detailsTo} className={buttonVariants({ variant: action ? 'outline' : 'default', size: 'sm' })}>
                        View details
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export { ActiveRepairCard };
