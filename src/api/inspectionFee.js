// Inspection-fee money outcomes (job-portal phase D).

// What cancelling the booked visit now would do: { cancellable, outcome:
// 'refund' | 'kept', fee, refundCutoffAt }.
export async function getBookingCancellation(axiosSecure, requestId) {
    return (await axiosSecure.get(`/repair-requests/${requestId}/booking-cancellation`)).data;
}

export async function cancelBooking(axiosSecure, requestId) {
    return (await axiosSecure.post(`/repair-requests/${requestId}/cancel-booking`)).data;
}

// Admin: send an inspection-fee refund that Stripe did not complete.
export async function retryInspectionFeeRefund(axiosSecure, requestId) {
    return (await axiosSecure.post(`/admin/repair-requests/${requestId}/inspection-fee/retry-refund`)).data;
}
