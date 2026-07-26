export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
    console.warn(
        '[config] VITE_API_BASE_URL is not set - falling back to http://localhost:3000. ' +
        'Set VITE_API_BASE_URL in your .env to point at a real backend.'
    );
}
