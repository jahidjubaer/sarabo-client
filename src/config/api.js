import { validateProductionApiBaseUrl } from './validateApiBaseUrl';

export { validateProductionApiBaseUrl };

function resolveApiBaseUrl() {
    const rawValue = import.meta.env.VITE_API_BASE_URL;

    if (import.meta.env.PROD) {
        return validateProductionApiBaseUrl(rawValue);
    }

    const trimmed = (rawValue ?? '').trim();
    if (!trimmed) {
        console.warn(
            '[config] VITE_API_BASE_URL is not set - falling back to http://localhost:3000. ' +
            'Set VITE_API_BASE_URL in your .env to point at a real backend.'
        );
        return 'http://localhost:3000';
    }
    return trimmed.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();
