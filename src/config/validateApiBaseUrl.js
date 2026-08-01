const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

// Pure and side-effect-free (no import.meta.env access) so it can be reused
// both by src/config/api.js (browser runtime) and vite.config.js (build-time,
// plain Node - vite build only bundles application source, it never executes
// it, so a check living solely inside api.js would never actually fail the
// build itself, only crash the deployed bundle when a browser loads it).
// Throws a plain Error naming the variable and the unmet requirement, never
// the value itself.
export function validateProductionApiBaseUrl(rawValue) {
    const trimmed = (rawValue ?? '').trim();
    if (!trimmed) {
        throw new Error('VITE_API_BASE_URL is required in production and must be an https:// URL.');
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new Error('VITE_API_BASE_URL must be a well-formed absolute URL.');
    }

    if (parsed.protocol !== 'https:') {
        throw new Error('VITE_API_BASE_URL must use https:// in production.');
    }

    if (LOOPBACK_HOSTNAMES.has(parsed.hostname)) {
        throw new Error('VITE_API_BASE_URL must not be a loopback/localhost address in production.');
    }

    // new URL(...).href always appends a trailing "/" for a path-less origin
    // (e.g. "https://api.example.com" -> "https://api.example.com/"), so the
    // strip has to happen after parsing, not before.
    return parsed.href.replace(/\/+$/, '');
}
