import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CircleCheckBig, CircleX, Loader2 } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useAuth from '../../../hooks/useAuth';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { buttonVariants } from '../../../components/ui/button-variants';
import { walletKeys } from '../../../hooks/walletKeys';

// Gives the customer a moment to read the confirmation before moving on -
// long enough to not feel rushed, short enough to not feel stuck.
const AUTO_REDIRECT_SECONDS = 5;

// Phase 12 aligns this page with the design system without touching a single
// semantic: the same PATCH /payment-success verification, the same
// once-per-mount guard, the same retry classification (transient 5xx/no
// response only), the same invalidations, the same countdown. The copy still
// claims only what the server actually confirmed - "Payment successful" is
// shown ONLY after a verified response, and the already-processed wording is
// preserved. No receipt, no invoice, no refund, no guarantee is implied.
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
                // Request Details page (`['repair-requests', id]`) for this request.
                queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
                // V2 approved-quote payments (Phase 6.4 Unit 6): once a payment
                // is confirmed the request moves to payment_completed, so both
                // the quote view and the payment-eligibility check must refetch
                // (eligibility flips to ALREADY_PAID, hiding Pay Now).
                queryClient.invalidateQueries({ queryKey: ['quote'] });
                queryClient.invalidateQueries({ queryKey: ['payment-eligibility'] });
                // Payment creates the Technician's pending settlement in the
                // same server transaction. Refresh every existing operational
                // list that can present the newly paid state.
                queryClient.invalidateQueries({ queryKey: walletKeys.technician() });
                queryClient.invalidateQueries({ queryKey: ['adminRepairRequests'] });
                queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] });
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
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 text-center sm:p-7">
                    <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full bg-ds-destructive/10 text-ds-destructive">
                        <CircleX className="size-6" />
                    </span>
                    <h1 className="mt-4 text-heading text-ds-foreground">We could not verify your payment yet</h1>
                    <p className="mt-2 text-body-sm text-ds-muted-foreground">
                        {errorMessage || 'No payment session was found. If you completed a payment, check My Repair Requests for its status.'}
                    </p>
                    {
                        canRetry &&
                        <p className="mt-2 text-micro text-ds-muted-foreground">Stripe may still be processing your payment - this can take a moment.</p>
                    }

                    {
                        canRetry &&
                        <Button onClick={handleRetry} className="mt-5 w-full">Retry verification</Button>
                    }

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Link to="/dashboard/my-requests" className={`${buttonVariants({ variant: 'outline' })} flex-1`}>View my repair requests</Link>
                        <Link to="/dashboard" className={`${buttonVariants({ variant: 'outline' })} flex-1`}>Go to dashboard</Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 text-center sm:p-7">
                {
                    status === 'verifying' ?
                        <div role="status" aria-live="polite">
                            <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-ds-primary" />
                            <h1 className="mt-4 text-heading text-ds-foreground">Verifying your payment…</h1>
                            <p className="mt-2 text-body-sm text-ds-muted-foreground">Please wait while we confirm this with Stripe.</p>
                        </div>
                        :
                        <>
                            <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full bg-ds-success/10 text-ds-success">
                                <CircleCheckBig className="size-6" />
                            </span>
                            <h1 className="mt-4 text-heading text-ds-foreground">
                                {alreadyProcessed ? 'Payment already confirmed' : 'Payment successful'}
                            </h1>
                            <p className="mt-2 text-body-sm text-ds-muted-foreground">
                                {alreadyProcessed
                                    ? 'This payment was already confirmed for your repair request.'
                                    : 'Your repair request payment has been confirmed.'}
                            </p>

                            {
                                (paymentInfo.transactionId || paymentInfo.trackingId) &&
                                <dl className="mt-5 divide-y divide-ds-border rounded-ds-lg border border-ds-border text-left">
                                    {
                                        paymentInfo.transactionId &&
                                        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                                            <dt className="shrink-0 text-body-sm text-ds-muted-foreground">Transaction ID</dt>
                                            <dd className="ds-numeric min-w-0 break-all text-right text-body-sm font-semibold text-ds-foreground">{paymentInfo.transactionId}</dd>
                                        </div>
                                    }
                                    {
                                        paymentInfo.trackingId &&
                                        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                                            <dt className="shrink-0 text-body-sm text-ds-muted-foreground">Request ID</dt>
                                            <dd className="ds-numeric min-w-0 break-all text-right text-body-sm font-semibold text-ds-foreground">{paymentInfo.trackingId}</dd>
                                        </div>
                                    }
                                </dl>
                            }

                            <p className="mt-5 text-micro text-ds-muted-foreground" role="status">
                                Taking you to My Repair Requests in {secondsLeft}s…
                            </p>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <Link to="/dashboard/my-requests" className={`${buttonVariants()} flex-1`}>View my repair requests</Link>
                                <Link to="/dashboard/payment-history" className={`${buttonVariants({ variant: 'outline' })} flex-1`}>View payment history</Link>
                            </div>
                            <Link to="/dashboard" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mt-2 w-full`}>Return to dashboard</Link>
                        </>
                }
            </Card>
        </div>
    );
};

export default PaymentSuccess;
