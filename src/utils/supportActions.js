export const SUPPORT_ACTIONS = Object.freeze({
    VIEW_SERVICES: Object.freeze({ id: 'VIEW_SERVICES', label: 'View services', to: '/services' }),
    TRACK_REQUEST: Object.freeze({ id: 'TRACK_REQUEST', label: 'Track a request', to: '/track-request' }),
    LOGIN: Object.freeze({ id: 'LOGIN', label: 'Sign in', to: '/login' }),
    REGISTER: Object.freeze({ id: 'REGISTER', label: 'Create an account', to: '/register' }),
});

export function resolveSupportActions(actions) {
    if (!Array.isArray(actions)) return [];
    const seen = new Set();
    const resolved = [];

    for (const action of actions) {
        const actionId = action?.id;
        if (typeof actionId !== 'string' || seen.has(actionId) || !SUPPORT_ACTIONS[actionId]) continue;
        seen.add(actionId);
        resolved.push(SUPPORT_ACTIONS[actionId]);
        if (resolved.length === 2) break;
    }

    return resolved;
}
