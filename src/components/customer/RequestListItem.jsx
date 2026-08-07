import { Link } from 'react-router';
import { Ban, CalendarDays, CreditCard, Eye, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { canCancelRequest } from '../../utils/cancellationEligibility';
import { canDeleteRequest } from '../../utils/deletionEligibility';
import { getProductSummary, getAgreedPrice, getRequestStatus } from '../../utils/customerRequestPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// One repair request as a responsive card (never a dense table cell). Cancel
// and Delete render ONLY when the existing authority helpers allow them - this
// component reuses canCancelRequest / canDeleteRequest verbatim and never
// re-derives eligibility. Payment keeps the exact prior condition/behaviour.
function RequestListItem({ request, onCancel, onDelete, onPay, cancellingId, deletingId, payingId }) {
    const { device, category, brandModel } = getProductSummary(request);
    const status = getRequestStatus(request);
    const presentation = getStatusPresentation(status);
    const price = getAgreedPrice(request);
    const detailsTo = `/dashboard/my-requests/${request._id}`;

    const isPaid = request.paymentStatus === 'paid';
    const isCancelled = status === 'cancelled';
    const showPay = !isPaid && !isCancelled;
    const showCancel = canCancelRequest(request);
    const showDelete = canDeleteRequest(request);

    return (
        <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-ds-foreground">{device}</h3>
                        <StatusBadge status={status} />
                    </div>
                    {(category || brandModel) && (
                        <p className="truncate text-sm text-ds-muted-foreground">{[category, brandModel].filter(Boolean).join(' · ')}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ds-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays aria-hidden="true" className="size-3.5" />
                            {formatAbsoluteDateTime(request.createdAt)}
                        </span>
                        {price && (
                            <span className="text-ds-foreground">Agreed price: <span className="font-medium">{price}</span></span>
                        )}
                    </div>
                    {presentation.customerNextStep && (
                        <p className="text-xs font-medium text-ds-warning">{presentation.customerNextStep}</p>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link to={detailsTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        <Eye aria-hidden="true" />
                        View
                    </Link>
                    {showPay && (
                        <Button size="sm" onClick={() => onPay(request)} disabled={payingId === request._id}>
                            <CreditCard aria-hidden="true" />
                            {payingId === request._id ? 'Starting...' : 'Pay'}
                        </Button>
                    )}
                    {showCancel && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onCancel(request)}
                            disabled={cancellingId === request._id}
                            aria-label="Cancel request"
                            className="text-ds-destructive hover:text-ds-destructive"
                        >
                            <Ban aria-hidden="true" />
                        </Button>
                    )}
                    {showDelete && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(request)}
                            disabled={deletingId === request._id}
                            aria-label="Delete request"
                            className="text-ds-destructive hover:text-ds-destructive"
                        >
                            <Trash2 aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

export { RequestListItem };
