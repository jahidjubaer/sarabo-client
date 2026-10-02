import { useQuery } from '@tanstack/react-query';
import useAxios from './useAxios';
import { getAiStatus } from '../api/aiHelper';

// Off (helper hidden) until the server says otherwise, and on any error.
export function useAiStatus() {
    const axiosPublic = useAxios();
    return useQuery({
        queryKey: ['ai-status'],
        queryFn: () => getAiStatus(axiosPublic),
        staleTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
    });
}
