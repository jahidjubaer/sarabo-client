import { useMutation } from '@tanstack/react-query';
import { sendSupportMessage } from '../api/support';
import useAxiosSecure from './useAxiosSecure';

export function useSupportChat() {
    const axiosSecure = useAxiosSecure();

    return useMutation({
        mutationFn: (payload) => sendSupportMessage(axiosSecure, payload),
        retry: false,
    });
}
