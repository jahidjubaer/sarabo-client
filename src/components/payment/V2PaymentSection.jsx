import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Lock, CircleCheckBig } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { usePaymentEligibility } from '../../hooks/usePaymentEligibility';
import { paymentKeys } from '../../hooks/paymentKeys';
import { createV2Checkout } from '../../api/payments';
import { formatMoney } from '../../utils/currency';
import { getPaymentErrorMessage } from '../../utils/paymentErrorMessage';
import { notify } from '../../lib/notify';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

// V2 approved-quote payment (Phase 6.4 Unit 6; redesigned to the design system
// in Phase 7.6). Whether anything appears is decided ENTIRELY by server
// eligibility (never inferred from quote status). The amount shown is the
// server's own eligibility amount (the approved quote total in its stored
// currency); the client never sends an amount or currency - Pay Now just asks
// the server to create the checkout session and redirects to Stripe. No
// business logic changed; only presentation + Toastify feedback.
// `bare` drops the card frame and heading, for when the section is placed
// inside a panel that already provides them (the repair workspace's next-step
// panel and stage sections).
function PaymentCard({ children, bare }) {
    if (bare) return <div className="space-y-4">{children}</div>;
    return (
        <Card>
            <CardContent className="space-y-4 p-5">
                <h2 className="text-sm font-semibold text-ds-foreground">Payment</h2>
                {children}
            </CardContent>
        </Card>
    );
}

const V2PaymentSection = ({ requestId, bare = false }) => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [redirecting, setRedirecting] = useState(false);
    const { data: eligibility, isLoading, isPaused, isError } = usePaymentEligibility(requestId);
    const hasUsableEligibility = eligibility !== undefined;
    const isInitialLoading = isLoading && !hasUsableEligibility;
    const isUnavailableBeforeData = isPaused && !hasUsableEligibility;
    const isReadErrorBeforeData = isError && !hasUsableEligibility;
    const retryEligibility = () => queryClient.resetQueries({ queryKey: paymentKeys.eligibility(requestId) });

    // Preserve the existing quiet loading/error treatment. A paused initial
    // read is different: eligibility is still unknown, so expose recovery
    // instead of making a potentially required customer action disappear.
    // Inside a next-step panel an empty body would leave the heading hanging,
    // so the frameless form shows a placeholder while eligibility loads.
    if (isInitialLoading) return bare ? <Skeleton className="h-28 w-full" aria-label="Loading payment" /> : null;
    if (isReadErrorBeforeData && !bare) return null;
    if (isReadErrorBeforeData) {
        return (
            <PaymentCard bare>
                <p className="text-body-sm text-ds-muted-foreground">Payment details could not be loaded right now.</p>
                <Button variant="outline" size="sm" onClick={retryEligibility}>Try again</Button>
            </PaymentCard>
        );
    }
    if (isUnavailableBeforeData) {
        return (
            <PaymentCard bare={bare}>
                <p className="text-sm text-ds-muted-foreground">Payment availability cannot be checked right now.</p>
                <Button variant="outline" size="sm" onClick={retryEligibility}>Try again</Button>
            </PaymentCard>
        );
    }
    if (!eligibility) return null;

    if (!eligibility.eligible && eligibility.code === 'ALREADY_PAID') {
        return (
            <PaymentCard bare={bare}>
                <p className="flex items-center gap-2 text-sm font-medium text-ds-success">
                    <CircleCheckBig aria-hidden="true" className="size-4" /> Payment completed for this repair request.
                </p>
            </PaymentCard>
        );
    }

    // Not payable yet - the quote section already communicates that state.
    if (!eligibility.eligible) return null;

    const handlePay = async () => {
        if (redirecting) return;
        setRedirecting(true);
        try {
            const { url } = await createV2Checkout(axiosSecure, requestId);
            if (!url) throw new Error('missing checkout url');
            window.location.href = url;
        } catch (error) {
            if (import.meta.env.DEV) console.error('V2 checkout creation failed:', error);
            notify.error(getPaymentErrorMessage(error));
            setRedirecting(false);
        }
    };

    return (
        <PaymentCard bare={bare}>
            <div className="flex items-center justify-between gap-4 rounded-ds-lg bg-ds-muted p-4">
                <span className="text-body-sm font-semibold text-ds-muted-foreground">Amount due</span>
                <span className="ds-numeric text-title text-ds-foreground">{formatMoney(eligibility.amount, eligibility.currency)}</span>
            </div>
            <Button variant="action" size="lg" onClick={handlePay} disabled={redirecting} className="w-full sm:w-auto">
                <CreditCard aria-hidden="true" />
                {redirecting ? 'Starting payment…' : `Pay ${formatMoney(eligibility.amount, eligibility.currency)}`}
            </Button>
            <p className="flex items-center gap-1.5 text-micro text-ds-muted-foreground">
                <Lock aria-hidden="true" className="size-3.5" /> Secure payment powered by Stripe
            </p>
        </PaymentCard>
    );
};

export default V2PaymentSection;
