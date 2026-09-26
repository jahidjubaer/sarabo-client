import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { getPickupSlots } from '../api/pickupSlots';

export const pickupSlotKeys = {
    all: ['pickup-slots'],
    region: (region) => ['pickup-slots', region],
};

// Open pickup slots for a region. Refreshed every minute while the picker is
// on screen, because slots fill up and close as the day goes on.
export function usePickupSlots(region) {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: pickupSlotKeys.region(region),
        queryFn: () => getPickupSlots(axiosSecure, region),
        enabled: typeof region === 'string' && region.length > 0,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}
