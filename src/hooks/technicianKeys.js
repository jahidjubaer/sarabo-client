// Query-key factory for the authenticated technician's own profile
// (Phase 9.2). Carries no email/uid - the server derives whose profile this is
// from the verified token, and account isolation comes from clearing this
// namespace on account switch, exactly like walletKeys and paymentKeys.
export const technicianKeys = {
    all: ['technician'],
    me: () => ['technician', 'me'],
};
