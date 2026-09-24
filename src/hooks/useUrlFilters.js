import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// List filters kept in the URL (Phase 5), so a filtered Admin list survives a
// refresh, the back button and a shared link, and the operations home can link
// straight into a pre-filtered list.
//
// `defaults` maps each filter name to its default string value. A value equal
// to its default is left out of the URL, so a plain list keeps a clean
// address. `page` is read as a number. Unknown params (a deep-link like
// ?request=) are left untouched.
//
//   const [filters, setFilters] = useUrlFilters({ q: '', status: 'all', page: '1' });
//   setFilters({ status: 'paid', page: '1' });
export function useUrlFilters(defaults) {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters = useMemo(() => {
        const next = {};
        for (const [key, fallback] of Object.entries(defaults)) {
            const raw = searchParams.get(key);
            next[key] = raw === null ? fallback : raw;
        }
        if ('page' in next) {
            const page = Number.parseInt(next.page, 10);
            next.page = Number.isInteger(page) && page > 0 ? page : 1;
        }
        return next;
        // defaults is a literal at each call site; its contents never change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const setFilters = useCallback((changes) => {
        setSearchParams((current) => {
            const params = new URLSearchParams(current);
            for (const [key, value] of Object.entries(changes)) {
                const text = value === undefined || value === null ? '' : String(value);
                if (text === '' || text === String(defaults[key] ?? '')) params.delete(key);
                else params.set(key, text);
            }
            return params;
        }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setSearchParams]);

    return [filters, setFilters];
}
