import { createElement, useState } from 'react';
import { Link } from 'react-router';
import { CalendarClock, Clock, MapPin, ReceiptText } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { getJobLocation } from '../../utils/technicianJobPresentation';
import { formatPickupSlot } from '../../utils/pickupSlots';
import { getProductCategoryIcon } from '../../utils/productCategoryIcons';
import { validateRejectionReason, REJECTION_REASON_MAX } from '../../utils/assignmentDecision';
import { formatMoneyRange } from '../../utils/currency';
import { formatRelativeTime } from '../../utils/relativeTime';

// A new job offer (assignment_pending) with everything needed to decide - the
// device, the customer's description of the fault, where it is and the
// estimate they saw - and Accept / Decline right here, instead of a "Review
// assignment" link to another page. Decline asks for a reason, exactly as the
// job details page does; both call the same endpoints.
function OfferCard({ job, onAccept, onDecline, pending }) {
    const [declineOpen, setDeclineOpen] = useState(false);
    const { device, category } = getProductSummary(job);
    const location = getJobLocation(job);
    const pickup = formatPickupSlot(job.pickupSlot);
    const pricing = job?.pricing;
    const estimate = pricing && typeof pricing.estimateMin === 'number' && typeof pricing.estimateMax === 'number'
        ? formatMoneyRange(pricing.estimateMin, pricing.estimateMax, pricing.currency)
        : null;
    const accepting = pending?.id === job._id && pending.kind === 'accept';
    const declining = pending?.id === job._id && pending.kind === 'decline';
    const busy = Boolean(pending);
    const headingId = `offer-${job._id}`;

    return (
        <Card className="border-l-4 border-l-ds-action p-5">
            <article aria-labelledby={headingId} className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <span className="hidden size-14 shrink-0 items-center justify-center rounded-ds-lg bg-ds-attention-subtle text-ds-attention-subtle-foreground sm:flex">
                    {createElement(getProductCategoryIcon(job?.product?.categorySlug), { 'aria-hidden': true, className: 'size-7' })}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 id={headingId} className="text-subhead text-ds-foreground">
                            <Link to={`/dashboard/assigned-jobs/${job._id}`} className="focus-ring rounded-ds-sm hover:text-ds-primary">{device}</Link>
                        </h3>
                        {category && <span className="text-body-sm text-ds-muted-foreground">{category}</span>}
                    </div>
                    {job.damage?.description && (
                        <p className="line-clamp-2 text-body-sm text-ds-foreground">“{job.damage.description}”</p>
                    )}
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ds-muted-foreground">
                        {location && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{location}</span>}
                        {pickup && <span className="inline-flex items-center gap-1.5"><CalendarClock aria-hidden="true" className="size-4" />Pickup <span className="font-semibold text-ds-foreground">{pickup}</span></span>}
                        {estimate && <span className="inline-flex items-center gap-1.5"><ReceiptText aria-hidden="true" className="size-4" />Estimate <span className="ds-numeric font-semibold text-ds-foreground">{estimate}</span></span>}
                        {job.updatedAt && <span className="inline-flex items-center gap-1.5"><Clock aria-hidden="true" className="size-4" />Offered {formatRelativeTime(job.updatedAt)}</span>}
                    </p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={() => setDeclineOpen(true)} disabled={busy} className="flex-1 lg:flex-none">
                        Decline
                    </Button>
                    <LoadingButton variant="action" onClick={() => onAccept(job)} loading={accepting} loadingText="Accepting…" disabled={busy} className="flex-1 lg:flex-none">
                        Accept job
                    </LoadingButton>
                </div>
            </article>

            <ConfirmDialog
                open={declineOpen}
                onOpenChange={setDeclineOpen}
                title="Decline this job?"
                description="Tell the team why you can't take it. It will be offered to another technician."
                confirmLabel="Decline job"
                destructive
                busy={declining}
                reason
                reasonLabel="Reason"
                reasonPlaceholder="e.g. Outside my current service area"
                reasonMaxLength={REJECTION_REASON_MAX}
                validateReason={validateRejectionReason}
                onConfirm={(reason) => onDecline(job, reason).then((ok) => { if (ok) setDeclineOpen(false); })}
            />
        </Card>
    );
}

export { OfferCard };
