// Stable, deterministic query-key factory for inspection queries. Never
// includes email/uid (mirrors damageImageKeys.js / notificationKeys.js) - the
// server resolves access per-caller (owner/admin/assigned-technician), so a
// cached response is already correctly scoped to whoever fetched it.
export const inspectionKeys = {
    all: ['inspection'],
    request: (requestId) => [...inspectionKeys.all, requestId],
};
