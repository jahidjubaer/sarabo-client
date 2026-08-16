import { Link } from 'react-router';
import { ArrowRight, Ban, CalendarDays, CircleAlert, CreditCard, Eye, Hash, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import { canCancelRequest } from '../../utils/cancellationEligibility';
import { canDeleteRequest } from '../../utils/deletionEligibility';
import { getProductSummary, getAgreedPrice, getRequestAction, getRequestStatus } from '../../utils/customerRequestPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Customer request row: status and any real Customer action lead; operational
// details and destructive controls stay secondary. Eligibility helpers and all
// handlers are passed through unchanged from MyRequests.
function RequestListItem({ request, onCancel, onDelete, onPay, cancellingId, deletingId, payingId }) {
    const { device, category, brandModel } = getProductSummary(request);
    const status = getRequestStatus(request);
    const presentation = getStatusPresentation(status);
    const action = getRequestAction(request);
    const price = getAgreedPrice(request);
    const detailsTo = `/dashboard/my-requests/${request._id}`;
    const headingId = `request-${request._id}`;

    const isPaid = request.paymentStatus === 'paid';
    const isCancelled = status === 'cancelled';
    const showPay = !isPaid && !isCancelled;
    const showCancel = canCancelRequest(request);
    const showDelete = canDeleteRequest(request);
    const paymentIsNext = action?.kind === 'payment';
    const detailsIsNext = Boolean(action) && !paymentIsNext;
    const actionCopy = action?.kind === 'handover'
        ? 'Confirm once you have received your repaired device.'
        : presentation.customerNextStep;

    const paymentButton = showPay ? (
        <Button
            size="sm"
            variant={paymentIsNext ? 'default' : 'outline'}
            onClick={() => onPay(request)}
            disabled={payingId === request._id}
        >
            <CreditCard aria-hidden="true" />
            {payingId === request._id ? 'Starting...' : (paymentIsNext ? 'Continue to payment' : 'Pay')}
        </Button>
    ) : null;

    return (
        <Card className="overflow-hidden">
            <article aria-labelledby={headingId}>
                <div className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <StatusBadge status={status} />
                            <div>
                                <h2 id={headingId} className="break-words text-base font-semibold text-ds-foreground">{device}</h2>
                                {(category || brandModel) && (
                                    <p className="mt-0.5 break-words text-sm text-ds-muted-foreground">{[category, brandModel].filter(Boolean).join(' · ')}</p>
                                )}
                            </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ds-muted-foreground">
                            <CalendarDays aria-hidden="true" className="size-3.5" />
                            {formatAbsoluteDateTime(request.createdAt)}
                        </span>
                    </div>

                    {action ? (
                        <div className="flex items-start gap-2 rounded-ds border border-ds-warning/30 bg-ds-warning/5 p-3">
                            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-warning" />
                            <div>
                                <p className="text-xs font-semibold text-ds-foreground">{action.label}</p>
                                {actionCopy && <p className="mt-0.5 text-xs text-ds-muted-foreground">{actionCopy}</p>}
                            </div>
                        </div>
                    ) : presentation.customerDescription ? (
                        <p className="text-sm text-ds-muted-foreground">{presentation.customerDescription}</p>
                    ) : null}

                    <div className="grid gap-2 text-xs text-ds-muted-foreground sm:grid-cols-2">
                        {request.trackingId && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <Hash aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                                <span className="break-all font-mono text-ds-foreground">{request.trackingId}</span>
                            </span>
                        )}
                        {price && (
                            <span className="text-ds-foreground">Agreed price: <span className="font-medium tabular-nums">{price}</span></span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-ds-border bg-ds-muted/20 px-4 py-3 sm:px-5">
                    {paymentIsNext && paymentButton}
                    <Link to={detailsTo} className={buttonVariants({ variant: detailsIsNext ? 'default' : 'outline', size: 'sm' })}>
                        {detailsIsNext ? action.label : 'View details'}
                        {detailsIsNext ? <ArrowRight aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Link>
                    {!paymentIsNext && paymentButton}
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
            </article>
        </Card>
    );
}

export { RequestListItem };
