import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useAuth from '../../../hooks/useAuth';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';

// Gives the customer a moment to read the confirmation before moving on -
// long enough to not feel rushed, short enough to not feel stuck.
const AUTO_REDIRECT_SECONDS = 5;

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const axiosSecure = useAxiosSecure();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // 'verifying' | 'verified' | 'failed'
    const [status, setStatus] = useState(sessionId ? 'verifying' : 'failed');
    const [paymentInfo, setPaymentInfo] = useState({});
    const [alreadyProcessed, setAlreadyProcessed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [canRetry, setCanRetry] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!sessionId) return;
        // Guards against React Strict Mode's double-invoke and any re-render
        // re-firing this effect - the request is sent at most once per mount
        // (or once per explicit retry, see handleRetry below). The
        // server-side idempotent check remains the real protection.
        if (hasVerified.current) return;
        hasVerified.current = true;

        axiosSecure.patch('/payment-success', { sessionId })
            .then(res => {
                setPaymentInfo({
                    transactionId: res.data.transactionId,
                    trackingId: res.data.trackingId
                });
                setAlreadyProcessed(!!res.data.alreadyProcessed);
                setStatus('verified');
                queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                queryClient.invalidateQueries({ queryKey: ['payments', user?.email] });
                // Partial-match invalidation: covers any currently-cached
                // Request Details page (`['parcels', id]`) for this request.
                queryClient.invalidateQueries({ queryKey: ['parcels'] });
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('Payment verification failed:', error);
                // A missing response (network blip) or 5xx is likely transient
                // (e.g. the webhook hasn't finished landing yet) - offer a
                // retry. 4xx outcomes (403/404/409/400) are permanent and
                // retrying would just repeat the same rejection.
                const httpStatus = error?.response?.status;
                setCanRetry(!httpStatus || httpStatus >= 500);
                setErrorMessage(getPaymentErrorMessage(error));
                setStatus('failed');
            });
    }, [sessionId, axiosSecure, queryClient, user?.email, retryCount]);

    // Auto-redirect countdown, active only once verification succeeds - the
    // customer can still navigate manually at any time, and the countdown is
    // clearly visible rather than instant/surprising.
    useEffect(() => {
        if (status !== 'verified') return;
        if (secondsLeft <= 0) {
            navigate('/dashboard/my-requests');
            return;
        }
        const timer = setTimeout(() => setSecondsLeft(seconds => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, secondsLeft, navigate]);

    const handleRetry = () => {
        hasVerified.current = false;
        setStatus('verifying');
        setRetryCount(count => count + 1);
    };

    if (status === 'failed') {
        return (
            <div className="flex items-center justify-center min-h-[70vh] p-4">
                <div className="bg-gradient-to-br from-error/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                    <div className="card bg-base-100 shadow-2xl">
                        <div className="card-body items-center text-center">
                            <div className="bg-error/10 rounded-full p-4">
                                <FaTimesCircle className="text-4xl text-error" />
                            </div>
                            <h2 className="text-3xl font-bold mt-2">We could not verify your payment yet</h2>
                            <p className="opacity-70">{errorMessage || 'No payment session was found. If you completed a payment, check My Repair Requests for its status.'}</p>
                            {
                                canRetry &&
                                <p className="opacity-60 text-sm mt-1">Stripe may still be processing your payment - this can take a moment.</p>
                            }

                            {
                                canRetry &&
                                <button onClick={handleRetry} className="btn btn-primary w-full mt-4">Retry Verification</button>
                            }

                            <div className="flex flex-col sm:flex-row gap-3 w-full mt-3">
                                <Link to="/dashboard/my-requests" className="btn btn-outline flex-1">View My Repair Requests</Link>
                                <Link to="/dashboard" className="btn btn-outline flex-1">Go to Dashboard</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body items-center text-center">
                        {
                            status === 'verifying' ?
                                <>
                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                    <h2 className="text-2xl font-bold mt-2">Verifying your payment...</h2>
                                    <p className="opacity-70">Please wait while we confirm this with Stripe.</p>
                                </>
                                :
                                <>
                                    <div className="bg-success/10 rounded-full p-4">
                                        <FaCheckCircle className="text-4xl text-success" />
                                    </div>
                                    <h2 className="text-3xl font-bold mt-2">
                                        {alreadyProcessed ? 'Payment already confirmed' : 'Payment successful'}
                                    </h2>
                                    <p className="opacity-70">
                                        {alreadyProcessed
                                            ? 'This payment was already confirmed for your repair request.'
                                            : 'Your repair request payment has been confirmed.'}
                                    </p>

                                    {
                                        (paymentInfo.transactionId || paymentInfo.trackingId) &&
                                        <div className="w-full mt-4 text-left bg-base-200 rounded-xl p-4 space-y-2">
                                            {
                                                paymentInfo.transactionId &&
                                                <div className="flex justify-between gap-4">
                                                    <span className="opacity-70">Transaction ID</span>
                                                    <span className="font-semibold text-right break-all">{paymentInfo.transactionId}</span>
                                                </div>
                                            }
                                            {
                                                paymentInfo.trackingId &&
                                                <div className="flex justify-between gap-4">
                                                    <span className="opacity-70">Request ID</span>
                                                    <span className="font-semibold text-right break-all">{paymentInfo.trackingId}</span>
                                                </div>
                                            }
                                        </div>
                                    }

                                    <p className="opacity-60 text-sm mt-4">
                                        Taking you to My Repair Requests in {secondsLeft}s...
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                                        <Link to="/dashboard/my-requests" className="btn btn-primary flex-1">View My Repair Requests</Link>
                                        <Link to="/dashboard/payment-history" className="btn btn-outline flex-1">View Payment History</Link>
                                    </div>
                                    <Link to="/dashboard" className="btn btn-ghost btn-sm w-full mt-2">Return to Dashboard</Link>
                                </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
