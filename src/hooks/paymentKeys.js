// Query-key factory for v2 approved-quote payment eligibility (Phase 6.4 Unit
// 6). Deliberately carries no email/uid - account isolation is handled by
// clearing this key namespace on account switch (see AuthProvider), never by
// scoping the key itself to an identity.
export const paymentKeys = {
    all: ['payment-eligibility'],
    eligibility: (requestId) => ['payment-eligibility', requestId],
};
