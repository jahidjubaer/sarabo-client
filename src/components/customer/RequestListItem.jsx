import { createElement } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Ban, CreditCard, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StatusBadge } from '../common/StatusBadge';
import { canCancelRequest } from '../../utils/cancellationEligibility';
import { canDeleteRequest } from '../../utils/deletionEligibility';
import { getProductSummary, getAgreedPrice, getRequestAction, getRequestStatus, canOfferPayment } from '../../utils/customerRequestPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getProductCategoryIcon } from '../../utils/productCategoryIcons';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// One request in My Requests (Phase 3): device, a short meta line, status, and
// at most ONE visible action - the customer's next step if there is one,
// otherwise "View". Cancel and Delete live in a labelled "More" menu rather
// than as two red icon-only buttons side by side. Eligibility helpers and all
// handlers are passed through unchanged from MyRequests.
function RequestListItem({ request, onCancel, onDelete, onPay, cancellingId, deletingId, payingId }) {
    const { device, category, brandModel } = getProductSummary(request);
    const status = getRequestStatus(request);
    const presentation = getStatusPresentation(status);
    const action = getRequestAction(request);
    const price = getAgreedPrice(request);
    const detailsTo = `/dashboard/my-requests/${request._id}`;
    const headingId = `request-${request._id}`;

    const showPay = canOfferPayment(request) && action?.kind === 'payment';
    const showCancel = canCancelRequest(request);
    const showDelete = canDeleteRequest(request);
    const busy = cancellingId === request._id || deletingId === request._id;
    const needsYou = Boolean(action);

    return (
        <Card className={cn('overflow-hidden transition-colors hover:border-ds-primary/40', needsYou && 'border-l-4 border-l-ds-action')}>
            <article aria-labelledby={headingId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-ds-lg bg-ds-muted text-ds-foreground sm:flex">
                    {createElement(getProductCategoryIcon(request?.product?.categorySlug), { 'aria-hidden': true, className: 'size-6' })}
                </span>

                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h2 id={headingId} className="min-w-0 break-words text-subhead">
                            <Link to={detailsTo} className="focus-ring rounded-ds-sm text-ds-foreground hover:text-ds-primary">{device}</Link>
                        </h2>
                        <StatusBadge audience="customer" status={status} showIcon={false} />
                    </div>
                    <p className="text-body-sm text-ds-muted-foreground">
                        {needsYou ? <span className="font-semibold text-ds-foreground">{action.label}. </span> : null}
                        {needsYou ? presentation.customerNextStep || '' : presentation.customerDescription}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-ds-muted-foreground">
                        {(category || brandModel) && <span>{[category, brandModel].filter(Boolean).join(' · ')}</span>}
                        {request.trackingId && <span className="ds-numeric">{request.trackingId}</span>}
                        <span>{formatAbsoluteDateTime(request.createdAt)}</span>
                        {price && <span>Agreed <span className="ds-numeric font-semibold text-ds-foreground">{price}</span></span>}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {showPay ? (
                        <Button variant="primary" onClick={() => onPay(request)} disabled={payingId === request._id} className="flex-1 sm:flex-none">
                            <CreditCard aria-hidden="true" />
                            {payingId === request._id ? 'Starting…' : 'Pay now'}
                        </Button>
                    ) : (
                        <Link to={detailsTo} className={cn(buttonVariants({ variant: needsYou ? 'primary' : 'outline' }), 'flex-1 sm:flex-none')}>
                            {needsYou ? action.label : 'View'}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    )}
                    {(showCancel || showDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="iconLg" aria-label={`More actions for ${device}`} disabled={busy}>
                                    <MoreHorizontal aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {showCancel && (
                                    <DropdownMenuItem variant="destructive" onSelect={() => onCancel(request)}>
                                        <Ban aria-hidden="true" /> Cancel request
                                    </DropdownMenuItem>
                                )}
                                {showDelete && (
                                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(request)}>
                                        <Trash2 aria-hidden="true" /> Delete request
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </article>
        </Card>
    );
}

export { RequestListItem };
