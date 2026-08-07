// Stable query-key factory for quote queries. Never includes email/uid (the
// server resolves access per-caller), mirroring inspectionKeys/damageImageKeys.
export const quoteKeys = {
    all: ['quote'],
    request: (requestId) => [...quoteKeys.all, requestId],
};
