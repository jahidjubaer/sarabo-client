import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';

// Admin-only: every technician record (GET /technicians), shared with the
// Technicians page through the same query key. Used to show a technician's
// name where a record only carries their id, and to pick a technician in a
// filter instead of typing a 24-character id.
//
// Returns { technicians, byId, isReady }. When the list is unavailable,
// callers fall back to showing the raw reference.
export function useTechnicianDirectory({ enabled = true } = {}) {
    const axiosSecure = useAxiosSecure();
    const query = useQuery({
        queryKey: ['technicians', 'all'],
        queryFn: async () => (await axiosSecure.get('/technicians')).data,
        enabled,
        staleTime: 60_000,
    });
    const list = Array.isArray(query.data) ? query.data : null;
    return useMemo(() => {
        const technicians = list
            ? [...list].filter((t) => t?._id).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];
        const byId = new Map(technicians.map((t) => [String(t._id), t]));
        return { technicians, byId, isReady: !!list };
    }, [list]);
}
