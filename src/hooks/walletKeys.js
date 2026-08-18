// Query-key factory for the technician wallet and the admin withdrawal queue
// (Phase 9). Deliberately carries no email/uid - account isolation is handled
// by clearing this key namespace on account switch (see AuthProvider), never by
// scoping the key itself to an identity. Same convention as paymentKeys.js.
//
// Two separate namespaces on purpose: a technician reads only their own wallet
// (the server derives whose it is from the verified token), while an admin
// reads a filtered, paginated queue across every technician. An admin
// processing a withdrawal invalidates the admin list; it can never reach into
// another user's cached wallet, which refetches on its own next read.
export const walletKeys = {
    all: ['wallet'],
    technician: () => ['wallet', 'technician'],
    adminAll: ['admin-withdrawals'],
    adminList: (filters) => ['admin-withdrawals', 'list', filters],
};
