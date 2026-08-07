// Narrow client wrapper over the authenticated quote endpoints (Phase 6.4
// Unit 5). All use the caller's axiosSecure (Firebase bearer token); no
// signed-URL/storage interaction and no client-side persistence of quote data.

export async function getQuote(axiosSecure, requestId) {
    const res = await axiosSecure.get(`/parcels/${requestId}/quote`);
    // { quote: { status, laborAmount, partsAmount, additionalCharges,
    //   totalAmount, currency, notes, submittedAt, decidedAt, decisionReason,
    //   version } } - or { status: 'not_submitted' }.
    return res.data.quote;
}

export async function submitQuote(axiosSecure, requestId, payload) {
    const res = await axiosSecure.post(`/parcels/${requestId}/quote`, payload);
    return res.data;
}

// decision: { decision: 'approve' | 'reject', reason? }
export async function decideQuote(axiosSecure, requestId, decision) {
    const res = await axiosSecure.post(`/parcels/${requestId}/quote/decision`, decision);
    return res.data;
}
