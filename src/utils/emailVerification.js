// Pure helpers for the email-verification flow (Phase 8.1). Firebase is the
// verification authority - nothing here trusts a provider name or a client-set
// flag, and the SERVER (verifyEmailVerified middleware) remains authoritative
// for sensitive mutations. These helpers only drive client UX + routing.

// A Firebase user is "verified" only if emailVerified is strictly true. Google
// users report true; email/password users report true only after they follow
// the verification link and the local user is reloaded. Provider is never
// hardcoded to verified.
export function isUserEmailVerified(user) {
    return !!(user && user.emailVerified === true);
}

// True when a path contains any ASCII control character (0x00-0x1F). Uses
// charCodeAt rather than a control-char regex literal so no control byte is
// embedded in source.
function hasControlChar(str) {
    for (let i = 0; i < str.length; i += 1) {
        if (str.charCodeAt(i) <= 0x1f) return true;
    }
    return false;
}

// Open-redirect guard: only allow an internal app path (a single leading "/",
// no protocol-relative "//", no scheme, no control chars). Anything else falls
// back to a safe default, so an intended-destination value can never send the
// user off the Sarabo origin.
export function sanitizeInternalPath(path, fallback = '/') {
    if (typeof path !== 'string') return fallback;
    if (!path.startsWith('/')) return fallback;
    if (path.startsWith('//')) return fallback;
    if (path.includes('://')) return fallback;
    if (hasControlChar(path)) return fallback;
    return path;
}

// Where an authenticated user should land: the verify page if not verified,
// otherwise the (sanitized) intended internal path or a fallback.
export function resolveAuthLandingPath(user, intended, fallback = '/') {
    if (!isUserEmailVerified(user)) return '/verify-email';
    return sanitizeInternalPath(intended, fallback);
}

// Resend cooldown (UX protection only - it does NOT replace Firebase's own
// anti-abuse rate limiting). Remaining whole seconds given the last-sent
// timestamp.
export const RESEND_COOLDOWN_SECONDS = 60;

export function getResendCooldownRemaining(lastSentAt, now = Date.now(), windowSeconds = RESEND_COOLDOWN_SECONDS) {
    if (!lastSentAt || typeof lastSentAt !== 'number') return 0;
    const elapsed = Math.floor((now - lastSentAt) / 1000);
    const remaining = windowSeconds - elapsed;
    return remaining > 0 ? remaining : 0;
}

// Verification status presentation for a Badge + label (meaning carried by text
// too, not colour alone).
export function getVerificationPresentation(user) {
    if (isUserEmailVerified(user)) {
        return { verified: true, label: 'Verified', tone: 'success' };
    }
    return { verified: false, label: 'Verification required', tone: 'warning' };
}

// Whether an authenticated user needs the verification gate at all. Only
// relevant while a user is signed in and unverified.
export function needsEmailVerification(user) {
    return !!user && !isUserEmailVerified(user);
}

// Maps a Firebase auth error to safe, human-facing copy - never a raw
// Firebase code/stack. Covers the cases the verification flow can hit.
export function getVerificationErrorMessage(error) {
    const code = error?.code || '';
    switch (code) {
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a little while before trying again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
        case 'auth/user-token-expired':
        case 'auth/requires-recent-login':
            return 'Your session has expired. Please log in again to continue.';
        default:
            return 'Something went wrong. Please try again.';
    }
}
