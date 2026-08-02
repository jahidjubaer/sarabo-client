// Stable, deterministic query-key factory for the current authenticated
// user's role. Deliberately never includes email/uid - account separation
// instead relies on clearing this cache branch on logout/auth-user change
// (see AuthProvider.jsx), the same pattern already used for notifications
// (see notificationKeys.js).
export const roleKeys = {
    current: () => ['user-role'],
};
