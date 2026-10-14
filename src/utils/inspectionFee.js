import { formatMoney } from './currency';

// Mirrors the server's fee floor (sarabo-server utils/inspectionFee.js): every
// repair has an inspection fee of at least 100 BDT when the estimate tops out
// at 1,000 BDT or less, and at least 200 BDT for bigger repairs.
export const SMALL_JOB_MAX_ESTIMATE_BDT = 1000;

export function minimumInspectionFee(estimateMax) {
    const max = Number(estimateMax);
    return Number.isFinite(max) && max > 0 && max <= SMALL_JOB_MAX_ESTIMATE_BDT ? 100 : 200;
}

// Statuses in which a booked visit has not happened yet (the device is not
// collected) - the same set the server allows a paid visit to be cancelled in.
const BOOKED_NOT_COLLECTED = ['assignment_pending', 'driver_assigned', 'rider_arriving'];

export function canCancelBookedVisit(request) {
    return BOOKED_NOT_COLLECTED.includes(request?.deliveryStatus) && request?.inspectionPayment?.status === 'paid';
}

// One plain sentence about the inspection fee for the request owner, or null.
export function inspectionFeeSentence(request) {
    const payment = request?.inspectionPayment;
    if (!payment) return null;
    const fee = formatMoney(payment.amount, payment.currency || 'BDT');
    switch (payment.status) {
        case 'paid':
            return `You paid the ${fee} inspection fee. It counts toward the final price if you go ahead with the repair.`;
        case 'refund_pending':
            return `Your ${fee} inspection fee is being refunded. It can take a few days to reach your card.`;
        case 'refunded':
            return `Your ${fee} inspection fee was refunded to your card.`;
        case 'kept':
            return payment.keptReason === 'quote_declined'
                ? `The ${fee} inspection fee paid for the technician's visit and inspection, so it was not refunded when you declined the price.`
                : `The ${fee} inspection fee was not refunded because the visit was cancelled less than 2 hours before it started.`;
        default:
            return null;
    }
}
