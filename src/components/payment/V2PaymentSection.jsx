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

// V2 approved-quote payment (Phase 6.4 Unit 6; redesigned to the design system
// in Phase 7.6). Whether anything appears is decided ENTIRELY by server
// eligibility (never inferred from quote status). The amount shown is the
// server's own eligibility amount (the approved quote total in its stored
// currency); the client never sends an amount or currency - Pay Now just asks
// the server to create the checkout session and redirects to Stripe. No
// business logic changed; only presentation + Toastify feedback.
function PaymentCard({ children }) {
    return (
        <Card>
            <CardContent className="space-y-4 p-5">
                <h2 className="text-sm font-semibold text-ds-foreground">Payment</h2>
                {children}
            </CardContent>
        </Card>
    );
}

const V2PaymentSection = ({ requestId }) => {
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
    if (isInitialLoading || isReadErrorBeforeData) return null;
    if (isUnavailableBeforeData) {
        return (
            <PaymentCard>
                <p className="text-sm text-ds-muted-foreground">Payment availability cannot be checked right now.</p>
                <Button variant="outline" size="sm" onClick={retryEligibility}>Try again</Button>
            </PaymentCard>
        );
    }
    if (!eligibility) return null;

    if (!eligibility.eligible && eligibility.code === 'ALREADY_PAID') {
        return (
            <PaymentCard>
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
        <PaymentCard>
            <div className="flex items-center justify-between gap-4 rounded-ds border border-ds-border bg-ds-muted/40 p-4">
                <span className="text-sm text-ds-muted-foreground">Amount due</span>
                <span className="text-2xl font-bold text-ds-primary tabular-nums">{formatMoney(eligibility.amount, eligibility.currency)}</span>
            </div>
            <Button variant="action" onClick={handlePay} disabled={redirecting} className="w-full">
                <CreditCard aria-hidden="true" />
                {redirecting ? 'Starting payment…' : 'Pay now'}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ds-muted-foreground">
                <Lock aria-hidden="true" className="size-3.5" /> Secure payment powered by Stripe
            </p>
        </PaymentCard>
    );
};

export default V2PaymentSection;
