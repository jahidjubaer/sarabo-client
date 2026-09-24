import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { walletKeys } from './walletKeys';

// The technician's own wallet (GET /technician/wallet). The server derives
// whose wallet it is from the verified token. Shared by the Wallet page, the
// work-queue balance and the quote form's payout preview, so all three read
// one cached copy.
export function useTechnicianWallet({ enabled = true } = {}) {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: walletKeys.technician(),
        queryFn: async () => (await axiosSecure.get('/technician/wallet')).data,
        enabled,
    });
}
