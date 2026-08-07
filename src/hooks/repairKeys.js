// Query-key factory for the v2 repair workflow (Phase 6.4 Unit 7). Carries no
// email/uid - account isolation is handled by clearing this namespace on
// account switch (see AuthProvider), never by scoping the key to an identity.
export const repairKeys = {
    all: ['repair'],
    request: (requestId) => ['repair', requestId],
};
