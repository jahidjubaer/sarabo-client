import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import { MdPayment } from 'react-icons/md';
import { FaLock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ErrorState } from '../../../components/common/ErrorState';

const Payment = () => {
    const { requestId } = useParams();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [submitting, setSubmitting] = useState(false);
    const requestQueryKey = ['repair-requests', requestId];

    const requestQuery = useQuery({
        queryKey: requestQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/${requestId}`);
            return res.data;
        }
    })

    const request = requestQuery.data;
    const hasUsableRequest = request !== null && typeof request === 'object' && !Array.isArray(request);
    const isInitialLoading = requestQuery.isPending && !requestQuery.isPaused && !hasUsableRequest;
    const isUnavailableBeforeData = requestQuery.isPaused && !hasUsableRequest;
    const isErrorBeforeData = requestQuery.isError && !hasUsableRequest;
    const retryRequest = () => queryClient.resetQueries({ queryKey: requestQueryKey });

    // Only the request's own id is sent - the amount and customer identity
    // are always resolved server-side from trusted, stored data.
    const handlePayment = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const res = await axiosSecure.post('/payment-checkout-session', { requestId: request._id });
            window.location.href = res.data.url;
        } catch (error) {
            if (import.meta.env.DEV) console.error('Checkout session creation failed:', error);
            Swal.fire({ icon: 'error', title: 'Could not start payment', text: getPaymentErrorMessage(error) });
            setSubmitting(false);
        }
    }

    if (isInitialLoading) {
        return <Loading></Loading>
    }

    if (isUnavailableBeforeData || isErrorBeforeData) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <ErrorState
                    title="Couldn't load payment details"
                    description="The repair request needed for this payment is unavailable right now. Please try again."
                    onRetry={retryRequest}
                    className="w-full max-w-md"
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body items-center text-center">
                        <div className="bg-primary/10 rounded-full p-4">
                            <MdPayment className="text-4xl text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold mt-2">Complete Your Payment</h2>

                        <div className="w-full mt-4 text-left bg-base-200 rounded-xl p-4 space-y-2">
                            {
                                request?.deviceName &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Repair Request</span>
                                    <span className="font-semibold text-right">{request.deviceName}</span>
                                </div>
                            }
                            {
                                request?.receiverRegion &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Device Category</span>
                                    <span className="font-semibold text-right">{request.receiverRegion}</span>
                                </div>
                            }
                            {
                                request?.priority &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Priority</span>
                                    <span className="font-semibold text-right capitalize">{request.priority}</span>
                                </div>
                            }
                        </div>

                        <div className="w-full mt-6">
                            <p className="opacity-70">Amount Payable</p>
                            <p className="text-4xl font-bold text-primary">{formatCurrency(request.cost)}</p>
                        </div>

                        <button onClick={handlePayment} disabled={submitting} className="btn btn-primary w-full mt-6">
                            {submitting ? 'Starting payment...' : 'Pay Now'}
                        </button>

                        <p className="flex items-center justify-center gap-2 text-xs opacity-60 mt-4">
                            <FaLock />
                            Secure payment powered by Stripe
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
