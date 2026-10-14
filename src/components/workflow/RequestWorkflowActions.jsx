import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Info } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { notify } from '../../lib/notify';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { formatMoney } from '../../utils/currency';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';

// Ways out of states where a repair used to get stuck (server:
// controllers/workflowController.js). Shown inside each role's "next step"
// panel; renders nothing when none applies. The server re-checks every action.

const NOTE_MAX = 500;
const requiredNote = (value) => (value.trim().length < 10
    ? { valid: false, message: 'Please explain in at least 10 characters.' }
    : value.length > NOTE_MAX ? { valid: false, message: `Keep it under ${NOTE_MAX} characters.` } : { valid: true });
const optionalNote = (value) => (value.length > NOTE_MAX ? { valid: false, message: `Keep it under ${NOTE_MAX} characters.` } : { valid: true });

const CLOSED_COPY = {
    payment_not_made: 'Closed because the approved price was not paid within 3 days.',
    customer_cancelled_unpaid: 'Closed by the customer before paying.',
    not_repairable: 'Closed because the inspection found the device cannot be repaired.',
    paid_repair_cancelled: 'Cancelled by an admin because the repair could not be finished. The payment is refunded.',
};

const ERROR_COPY = {
    PAYMENT_IN_PROGRESS: 'A payment page is open for this repair. Finish or close it, then try again.',
    ALREADY_REPORTED: 'You already reported this - an admin will decide.',
    REQUEST_CHANGED: 'This request changed meanwhile. Please reload it.',
    ALREADY_REFUNDED: 'This repair was already cancelled and refunded.',
    REFUND_FAILED: 'The repair is cancelled but the refund did not complete. Nothing was refunded twice - try again.',
};

function Note({ icon = Info, children }) {
    const NoteIcon = icon;
    return (
        <p className="flex items-start gap-2 rounded-ds border border-ds-border bg-ds-muted/40 p-3 text-body-sm text-ds-foreground">
            <NoteIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-muted-foreground" />
            <span>{children}</span>
        </p>
    );
}

function When({ value }) {
    return value ? <time dateTime={value}>{formatAbsoluteDateTime(value)}</time> : null;
}

// Every action this panel can take, by key: path, confirm copy, whether a note is required.
const ACTIONS = {
    cancelUnpaid: {
        path: (id) => `/repair-requests/${id}/cancel-unpaid`, title: 'Cancel this repair?',
        description: 'The request is closed and your technician returns your device. A paid inspection fee is kept, because the device was already inspected.',
        confirm: 'Cancel repair', destructive: true, done: 'Repair cancelled. Your technician will return your device.',
    },
    closeNotRepairable: {
        path: (id) => `/repair-requests/${id}/close-not-repairable`, title: 'Close as not repairable?',
        description: 'The request is closed and the device goes back to the customer. A paid inspection fee is kept for the inspection.',
        confirm: 'Close request', destructive: true, done: 'Request closed. Please arrange the device return.',
    },
    cannotComplete: {
        path: (id) => `/repair-requests/${id}/repair/cannot-complete`, title: "Can't finish this repair?",
        description: 'Admins are told straight away. They can cancel the repair and refund the customer.',
        note: { label: 'What is stopping the repair?', placeholder: 'For example: the replacement part is out of stock everywhere.', required: true },
        confirm: 'Tell an admin', destructive: true, done: 'Reported. An admin will decide.',
    },
    markReturned: {
        path: (id) => `/repair-requests/${id}/mark-returned`, title: 'Device returned to the customer?',
        description: 'The customer is asked to confirm. If they do not answer within 3 days, it is confirmed automatically (for a finished repair, that also makes your money available).',
        confirm: 'Yes, returned', done: 'Marked returned. The customer has been asked to confirm.',
    },
    disputeReceipt: {
        path: (id) => `/repair-requests/${id}/receipt-dispute`, title: "Haven't received your device?",
        description: 'Admins and your technician are told, and nothing is confirmed automatically until an admin has checked.',
        note: { label: 'Anything to add? (optional)', placeholder: 'For example: nobody came at the agreed time.' },
        confirm: "I haven't received it", done: 'Thanks - an admin will look into it.',
    },
    adminCancelPaid: {
        path: (id) => `/admin/repair-requests/${id}/cancel-paid-repair`, title: 'Cancel and refund this repair?',
        description: "Refunds the customer the repair payment and the inspection fee that counted toward it (Stripe test mode), takes the technician's share back from their wallet and frees the technician.",
        note: { label: 'Reason (both sides see it)', required: true },
        confirm: 'Cancel and refund', destructive: true, done: 'Repair cancelled and refunded.',
    },
    adminRetryRefund: {
        path: (id) => `/admin/repair-requests/${id}/cancel-paid-repair`, title: 'Retry the refund?',
        description: 'Only the part that failed is tried again. Nothing is refunded twice.', confirm: 'Retry refund', done: 'Refund sent.',
    },
    adminConfirmReceipt: {
        path: (id) => `/admin/repair-requests/${id}/confirm-receipt`, title: 'Confirm the customer received the device?',
        description: "This releases the technician's money and starts the 30-day warranty.",
        note: { label: 'How was it confirmed? (both sides are told)', required: true },
        confirm: 'Confirm receipt', done: 'Receipt confirmed.',
    },
    adminConfirmReturn: {
        path: (id) => `/admin/repair-requests/${id}/confirm-receipt`, title: 'Confirm the device was returned?',
        description: 'The request was cancelled after pickup; this records that the customer has their device back.',
        note: { label: 'How was it confirmed? (both sides are told)', required: true },
        confirm: 'Confirm returned', done: 'Return confirmed.',
    },
    confirmReturn: {
        path: (id) => `/repair-requests/${id}/confirm-return`, title: 'Got your device back?',
        description: 'This records that your technician returned your device.', confirm: 'Yes, I have it', done: 'Thanks - recorded.',
    },
    customerNotHome: {
        path: (id) => `/repair-requests/${id}/customer-not-available`, title: "Customer wasn't available?",
        description: 'The booking stays yours, and the customer is asked to choose a new pickup time.',
        note: { label: 'What happened?', placeholder: 'For example: rang the bell and called twice, no answer.', required: true },
        confirm: 'Ask for a new time', done: 'The customer has been asked to choose a new pickup time.',
    },
    disputeCondition: {
        path: (id) => `/repair-requests/${id}/pickup-condition/dispute`, title: "Condition at pickup isn't right?",
        description: 'Your technician and an admin are told. An admin reviews it with both of you.',
        note: { label: 'What is wrong with it?', placeholder: 'For example: the screen was not cracked when I handed it over.', required: true },
        confirm: 'Send', done: 'Thanks - an admin will review it.',
    },
    adminReviewCondition: {
        path: (id) => `/admin/repair-requests/${id}/pickup-condition/reviewed`, title: 'Mark the condition dispute reviewed?',
        description: 'The customer is told it was reviewed. Write what you found.',
        note: { label: 'What you found (the customer sees it)', required: true },
        confirm: 'Mark reviewed', done: 'Marked reviewed.',
    },
};

const CONDITION_LABEL = 'Condition at pickup';

function RequestWorkflowActions({ request, audience }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(null);
    const action = open ? ACTIONS[open] : null;
    const run = useMutation({
        mutationFn: ({ key, note }) => axiosSecure.post(ACTIONS[key].path(request._id), note === undefined ? {} : { note }),
        onSuccess: (_, { key }) => notify.success(ACTIONS[key].done),
        onError: (error) => notify.error(ERROR_COPY[error?.response?.data?.code] || error?.response?.data?.message || 'That did not work. Please try again.'),
        onSettled: () => {
            setOpen(null);
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            queryClient.invalidateQueries({ queryKey: ['admin-attention'] });
        },
    });

    const status = request.deliveryStatus;
    const ret = request.deviceReturn || {};
    const confirmed = request.customerReceiptConfirmation?.status === 'confirmed';
    const notes = [];
    const buttons = [];
    const add = (key, label, variant = 'outline') => buttons.push(<Button key={key} variant={variant} onClick={() => setOpen(key)} disabled={run.isPending}>{label}</Button>);

    // Pickup condition (recorded by the technician when collecting the device).
    const condition = request.pickupCondition;
    if (condition) {
        notes.push(<><strong>{CONDITION_LABEL}:</strong> {condition.note}{condition.accessories ? ` Accessories: ${condition.accessories}.` : ''}</>);
        if (condition.customerDisputedAt) {
            notes.push(condition.reviewedAt
                ? <>The customer disagreed (“{condition.customerNote}”). Reviewed by an admin: {condition.reviewNote}</>
                : <>The customer disagreed: “{condition.customerNote}”. An admin will review it.</>);
            if (audience === 'admin' && !condition.reviewedAt) add('adminReviewCondition', 'Mark condition reviewed', 'action');
        } else if (audience === 'customer') {
            add('disputeCondition', "That's not right");
        }
    }
    // The technician could not reach the customer at pickup.
    if (request.pickupAttempt && request.pickupRescheduleRequestedAt) {
        notes.push(audience === 'customer'
            ? <>Your technician came <When value={request.pickupAttempt.failedAt} /> but could not reach you: “{request.pickupAttempt.note}”. Please choose a new pickup time.</>
            : <>Customer not available <When value={request.pickupAttempt.failedAt} />: “{request.pickupAttempt.note}”. Waiting for a new pickup time.</>);
    }
    if (audience === 'technician' && ['driver_assigned', 'rider_arriving'].includes(status) && !request.pickupRescheduleRequestedAt) {
        add('customerNotHome', 'Customer not available');
    }

    if (status === 'cancelled' && CLOSED_COPY[request.cancellationReason]) {
        notes.push(CLOSED_COPY[request.cancellationReason]);
        const refund = request.cancellationRefund;
        if (refund) {
            notes.push(<>Refund of <span className="ds-numeric">{formatMoney(refund.total, refund.currency || 'BDT')}</span>{refund.refundedAt ? <> sent <When value={refund.refundedAt} />.</> : ' is being processed.'}</>);
            if (audience === 'admin' && !refund.refundedAt) add('adminRetryRefund', 'Retry refund', 'action');
        }
    }
    if (status === 'quote_approved' && request.paymentDueAt) {
        notes.push(audience === 'customer'
            ? <>Please pay by <When value={request.paymentDueAt} />. If it is not paid by then, the request is closed and your device returned.</>
            : <>The customer must pay by <When value={request.paymentDueAt} />, or the request closes automatically.</>);
        if (audience === 'customer') add('cancelUnpaid', "I don't want the repair");
    }
    if (status === 'inspection_completed' && request.notRepairable) {
        notes.push('The inspection found this device cannot be repaired (or it is not worth repairing).');
        if (audience === 'customer' || audience === 'technician') add('closeNotRepairable', 'Close as not repairable', audience === 'technician' ? 'action' : 'outline');
    }
    if (['payment_completed', 'repair_in_progress'].includes(status)) {
        if (request.repairBlocked) {
            notes.push(<><AlertTriangle aria-hidden="true" className="mr-1 inline size-4" />The technician reported this repair cannot be finished: “{request.repairBlocked.reason}”</>);
        }
        if (audience === 'technician' && !request.repairBlocked) add('cannotComplete', "Can't finish this repair");
        if (audience === 'admin') add('adminCancelPaid', 'Cancel and refund', request.repairBlocked ? 'action' : 'outline');
    }
    // A request cancelled after pickup: the device has to go back.
    if (status === 'cancelled' && ret.required) {
        if (ret.confirmedAt) {
            notes.push(<>Device returned to the customer (confirmed <When value={ret.confirmedAt} />).</>);
        } else {
            if (ret.disputedAt) {
                notes.push(<>The customer says the device has not been returned{ret.disputeNote ? `: “${ret.disputeNote}”` : ''}. An admin is checking.</>);
            } else if (ret.markedAt) {
                notes.push(audience === 'customer'
                    ? <>Your technician marked your device returned. It is confirmed automatically on <When value={ret.autoConfirmAt} /> unless you tell us otherwise.</>
                    : <>Marked returned <When value={ret.markedAt} />. Confirmed automatically on <When value={ret.autoConfirmAt} /> unless the customer reports a problem.</>);
            } else {
                notes.push(audience === 'customer' ? 'Your technician will return your device.' : 'The device has to be returned to the customer.');
            }
            if (audience === 'technician' && !ret.markedAt) add('markReturned', 'Mark device returned', 'action');
            if (audience === 'customer') {
                add('confirmReturn', 'I have my device back', ret.markedAt ? 'action' : 'outline');
                if (!ret.disputedAt) add('disputeReceipt', "I haven't received it");
            }
            if (audience === 'admin') add('adminConfirmReturn', 'Confirm returned', ret.disputedAt ? 'action' : 'outline');
        }
    }
    if (status === 'repair_completed' && !confirmed) {
        if (ret.disputedAt) {
            notes.push(<>The customer reported the device was not received <When value={ret.disputedAt} />{ret.disputeNote ? `: “${ret.disputeNote}”` : ''}. An admin is checking.</>);
        } else if (ret.markedAt) {
            notes.push(audience === 'customer'
                ? <>Your technician marked the device returned. Please confirm you received it - it is confirmed automatically on <When value={ret.autoConfirmAt} />.</>
                : <>Marked returned <When value={ret.markedAt} />. Confirmed automatically on <When value={ret.autoConfirmAt} /> unless the customer reports a problem.</>);
        }
        if (audience === 'technician' && !ret.markedAt) add('markReturned', 'Mark device returned', 'action');
        if (audience === 'customer' && !ret.disputedAt) add('disputeReceipt', "I haven't received it");
        if (audience === 'admin') add('adminConfirmReceipt', 'Confirm receipt', ret.disputedAt ? 'action' : 'outline');
    }

    if (notes.length === 0 && buttons.length === 0) return null;
    return (
        <div className="space-y-3">
            {notes.map((text, index) => <Note key={index}>{text}</Note>)}
            {buttons.length > 0 && <div className="flex flex-wrap gap-2">{buttons}</div>}
            <ConfirmDialog
                open={Boolean(action)}
                onOpenChange={(next) => { if (!next) setOpen(null); }}
                title={action?.title || ''}
                description={action?.description}
                reason={Boolean(action?.note)}
                reasonLabel={action?.note?.label}
                reasonPlaceholder={action?.note?.placeholder}
                reasonMaxLength={action?.note ? NOTE_MAX : undefined}
                validateReason={action?.note?.required ? requiredNote : optionalNote}
                confirmLabel={action?.confirm}
                destructive={Boolean(action?.destructive)}
                busy={run.isPending}
                onConfirm={(note) => run.mutate({ key: open, note: action?.note ? note : undefined })}
            />
        </div>
    );
}

export { RequestWorkflowActions };
