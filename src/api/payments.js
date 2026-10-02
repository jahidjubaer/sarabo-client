// Narrow client wrapper over the v2 approved-quote payment endpoints (Phase
// 6.4 Unit 6). All use the caller's axiosSecure (Firebase bearer token). The
// client never sends an amount, currency, quote total, or payment status - the
// server derives every authoritative value from the persisted approved quote.

// Reads whether the approved quote is payable right now. Returns the server's
// safe eligibility structure: { eligible:true, amount, currency, quoteVersion }
// or { eligible:false, code }. The amount/currency are display-only, always
// re-derived (and re-authorized) by the server on the actual charge.
export async function getV2PaymentEligibility(axiosSecure, requestId) {
    const res = await axiosSecure.get(`/repair-requests/${requestId}/payment-eligibility`);
    return res.data;
}

// Creates the Stripe Checkout Session for the approved quote. The body is
// deliberately empty: the server owns the amount (BDT, from quote.totalAmount)
// and currency. Returns { url } to redirect the browser to Stripe's hosted
// checkout - the exact same completion path (webhook + /payment-success
// verification) the legacy flow already uses.
export async function createV2Checkout(axiosSecure, requestId) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/checkout-session`, {});
    return res.data;
}

// Downloads the PDF receipt for one payment (the payer or an admin only).
// The server builds it from the stored payment; the file is saved through a
// temporary object URL.
export async function downloadPaymentReceipt(axiosSecure, transactionId, fallbackName = 'sarabo-receipt.pdf') {
    const res = await axiosSecure.get(`/payments/${encodeURIComponent(transactionId)}/receipt.pdf`, { responseType: 'blob' });
    const disposition = res.headers?.['content-disposition'] || '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = match ? match[1] : fallbackName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        // Give the browser a moment to start the download first.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
