// Narrow API layer for the authenticated notification endpoints (see
// sarabo-server's routes/notifications.js). Each function takes the
// caller's already-authenticated axios instance (from useAxiosSecure) rather
// than constructing its own, since axios instances here are hook-scoped
// (token attachment/401 handling depend on the current user) - this module
// stays a plain, hook-free function set. Server response shapes are
// returned as-is, never wrapped or reshaped.
function assertValidNotificationId(notificationId) {
    if (!notificationId || typeof notificationId !== 'string') {
        throw new Error('A valid notificationId is required');
    }
}

// params may only include page/limit/unreadOnly - the only parameters
// GET /notifications actually supports (see NotificationController.js).
export async function getNotifications(axiosSecure, params = {}) {
    const query = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.unreadOnly !== undefined) query.unreadOnly = params.unreadOnly;
    const res = await axiosSecure.get('/notifications', { params: query });
    return res.data;
}

export async function getUnreadNotificationCount(axiosSecure) {
    const res = await axiosSecure.get('/notifications/unread-count');
    return res.data;
}

export async function markNotificationRead(axiosSecure, notificationId) {
    assertValidNotificationId(notificationId);
    const res = await axiosSecure.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
    return res.data;
}

export async function markAllNotificationsRead(axiosSecure) {
    const res = await axiosSecure.patch('/notifications/read-all');
    return res.data;
}
