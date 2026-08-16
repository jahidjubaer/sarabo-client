import { Link } from 'react-router';
import { ArrowRight, CalendarDays, CircleAlert, Clock3, Hash, Package } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import { StatusBadge } from '../common/StatusBadge';
import ServiceSpine from '../spine/ServiceSpine';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getProductSummary, getAgreedPrice, getRequestAction } from '../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

// Focused Customer dashboard repair. The existing presentation-only action
// helper chooses the request; this component only establishes visual priority.
// Service progress continues to come from the shared canonical ServiceSpine.
function ActiveRepairCard({ request, className }) {
    if (!request) return null;

    const { device, category, brandModel } = getProductSummary(request);
    const presentation = getStatusPresentation(request.deliveryStatus);
    const action = getRequestAction(request);
    const price = getAgreedPrice(request);
    const detailsTo = `/dashboard/my-requests/${request._id}`;
    const ActionIcon = action ? CircleAlert : Clock3;
    const actionDescription = action?.kind === 'handover'
        ? 'Your repair is complete. Confirm once you have received your device.'
        : (presentation.customerNextStep || presentation.customerDescription);

    return (
        <Card className={cn('overflow-hidden', action ? 'border-ds-warning/40' : 'border-ds-primary/25', className)}>
            <CardContent className="p-0">
                <div className={cn('border-b border-ds-border px-5 py-5 sm:px-6', action ? 'bg-ds-warning/5' : 'bg-ds-muted/30')}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', action ? 'bg-ds-warning/15 text-ds-warning' : 'bg-ds-primary/10 text-ds-primary')}>
                                <ActionIcon aria-hidden="true" className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className={cn('ds-label', action ? 'text-ds-warning' : 'text-ds-primary')}>{action ? 'Action required' : 'No action required'}</p>
                                <h3 className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">{action?.label || presentation.label}</h3>
                                {actionDescription && <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">{actionDescription}</p>}
                            </div>
                        </div>
                        <StatusBadge status={request.deliveryStatus} className="self-start" />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 min-[390px]:flex-row min-[390px]:items-center">
                        {action ? (
                            <Link to={action.to} className={buttonVariants({ variant: 'action', size: 'sm' })}>
                                {action.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : null}
                        <Link to={detailsTo} className={buttonVariants({ variant: action ? 'outline' : 'default', size: 'sm' })}>
                            View repair details
                            {!action && <ArrowRight aria-hidden="true" />}
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
                        <p className="mb-3 ds-label text-ds-muted-foreground">Repair lifecycle</p>
                        <ServiceSpine request={request} />
                    </div>

                    <div className="grid gap-2 border-t border-ds-border pt-4 text-sm text-ds-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        {request.trackingId && (
                            <span className="inline-flex min-w-0 items-start gap-1.5">
                                <Hash aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                <span className="min-w-0 break-all font-mono text-xs text-ds-foreground">{request.trackingId}</span>
                            </span>
                        )}
                        <span className="inline-flex items-start gap-1.5">
                            <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            <span>Requested {formatAbsoluteDateTime(request.createdAt)}</span>
                        </span>
                        {price && (
                            <span className="text-ds-foreground">
                                Agreed price: <span className="font-medium">{price}</span>
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { ActiveRepairCard };
