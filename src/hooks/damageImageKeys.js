// Stable, deterministic query-key factory for damage-image queries.
// Deliberately never includes the user's email/uid (mirrors
// notificationKeys.js) - the server itself resolves access per-caller
// (owner/admin/assigned-technician), so a cached response is already
// scoped correctly to whoever fetched it. This cache branch carries
// short-lived signed read URLs, so it is explicitly removed on logout/
// account-switch in AuthProvider.jsx, the same way notification queries
// already are.
export const damageImageKeys = {
    all: ['damage-images'],
    request: (requestId) => [...damageImageKeys.all, requestId],
};
