// Admin actions on a missed pickup (missed-pickup phase). Admin-only; the
// server re-checks that the pickup really is missed.
export async function withdrawMissedPickup(axiosSecure, requestId) {
    return (await axiosSecure.post(`/admin/repair-requests/${requestId}/missed-pickup/withdraw`)).data;
}

export async function askForNewPickupTime(axiosSecure, requestId) {
    return (await axiosSecure.post(`/admin/repair-requests/${requestId}/missed-pickup/ask-new-time`)).data;
}
