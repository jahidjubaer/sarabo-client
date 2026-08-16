import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router';
import { CreditCard, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ErrorState } from '../../../components/common/ErrorState';
import { Card } from '../../../components/ui/card';
import { LoadingButton } from '../../../components/common/LoadingButton';

// Legacy (v1) checkout for a pre-quote repair request - reached only from
// Request Details, and only for a non-v2, unpaid, non-cancelled request the
// caller owns. Phase 12 aligns the presentation with the design system and
// changes NOTHING about the payment itself: the same query, the same
// query-state classification, the same single POST /payment-checkout-session
// carrying only the request id, the same Stripe redirect, the same amount
// source (request.cost, formatted by the legacy USD formatter). The CTA is
// still unreachable until the request is genuinely usable, so an unknown
// request can never expose a pay control.
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
        <div className="flex min-h-[70vh] items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 sm:p-7">
                <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-ds-lg bg-ds-accent text-ds-primary">
                        <CreditCard className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="ds-label text-ds-muted-foreground">Payment</p>
                        <h1 className="mt-1 text-heading text-ds-foreground">Complete your payment</h1>
                    </div>
                </div>

                {(request?.deviceName || request?.receiverRegion || request?.priority) && (
                    <dl className="mt-6 divide-y divide-ds-border rounded-ds-lg border border-ds-border">
                        {
                            request?.deviceName &&
                            <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                                <dt className="text-body-sm text-ds-muted-foreground">Device</dt>
                                <dd className="min-w-0 break-words text-right text-body-sm font-semibold text-ds-foreground">{request.deviceName}</dd>
                            </div>
                        }
                        {
                            // Legacy field: this is the request's service region,
                            // never a device category (the previous label said so
                            // and was simply wrong - see the server's own
                            // "legacy fields (deviceName, receiverRegion, ...)"
                            // note in technicianEligibilityService.js).
                            request?.receiverRegion &&
                            <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                                <dt className="text-body-sm text-ds-muted-foreground">Service region</dt>
                                <dd className="min-w-0 break-words text-right text-body-sm font-semibold text-ds-foreground">{request.receiverRegion}</dd>
                            </div>
                        }
                        {
                            request?.priority &&
                            <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                                <dt className="text-body-sm text-ds-muted-foreground">Priority</dt>
                                <dd className="min-w-0 break-words text-right text-body-sm font-semibold capitalize text-ds-foreground">{request.priority}</dd>
                            </div>
                        }
                    </dl>
                )}

                <div className="mt-6 rounded-ds-lg bg-ds-muted p-4">
                    <p className="ds-label text-ds-muted-foreground">Amount payable</p>
                    {/* Unchanged amount source and formatter - this legacy flow
                        has always shown request.cost through formatCurrency. */}
                    <p className="ds-numeric mt-1 break-all text-title text-ds-foreground">{formatCurrency(request.cost)}</p>
                </div>

                {/* Marigold: the single highest-priority real action on this page. */}
                <LoadingButton
                    onClick={handlePayment}
                    loading={submitting}
                    loadingText="Starting payment…"
                    variant="action"
                    size="lg"
                    className="mt-6 w-full"
                >
                    Pay now
                </LoadingButton>

                <p className="mt-4 flex items-center justify-center gap-2 text-micro text-ds-muted-foreground">
                    <Lock aria-hidden="true" className="size-3.5" />
                    Secure payment powered by Stripe
                </p>
            </Card>
        </div>
    );
};

export default Payment;
