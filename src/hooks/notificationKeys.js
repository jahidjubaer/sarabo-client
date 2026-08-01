// Stable, deterministic query-key factory for notification queries. Keys
// deliberately never include the user's email/uid - user separation instead
// relies on clearing this whole cache branch on logout/auth-user change
// (see AuthProvider.jsx), so a stale cache can never leak across accounts.
function normalizeListParams(params = {}) {
    const normalized = {};
    if (params.page !== undefined) normalized.page = params.page;
    if (params.limit !== undefined) normalized.limit = params.limit;
    if (params.unreadOnly !== undefined) normalized.unreadOnly = params.unreadOnly;
    return normalized;
}

export const notificationKeys = {
    all: ['notifications'],
    lists: () => [...notificationKeys.all, 'list'],
    list: (params) => [...notificationKeys.lists(), normalizeListParams(params)],
    unreadCount: () => [...notificationKeys.all, 'unread-count'],
};

export { normalizeListParams };
