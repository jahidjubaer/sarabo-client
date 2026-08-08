// Client-only preference for the first-time public welcome banner (Phase 7.10).
// UI-only, namespaced localStorage - never holds auth/user/business data, never
// synced to an account. Every access is defensive so a blocked/unavailable
// storage (private mode) degrades to "show the banner" rather than throwing.

export const WELCOME_DISMISSED_KEY = 'sarabo:welcome-dismissed';

// A storage object can be injected for testing; defaults to window.localStorage.
function getStore(store) {
    if (store) return store;
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
}

export function isWelcomeDismissed(store) {
    const s = getStore(store);
    if (!s) return false;
    try {
        return s.getItem(WELCOME_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

export function dismissWelcome(store) {
    const s = getStore(store);
    if (!s) return;
    try {
        s.setItem(WELCOME_DISMISSED_KEY, '1');
    } catch {
        /* storage unavailable - dismissal stays in-memory for this session */
    }
}
