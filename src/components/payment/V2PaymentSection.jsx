import { useState } from 'react';
import { FaCreditCard, FaLock, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { usePaymentEligibility } from '../../hooks/usePaymentEligibility';
import { createV2Checkout } from '../../api/payments';
import { formatMoney } from '../../utils/currency';
import { getPaymentErrorMessage } from '../../utils/paymentErrorMessage';

// V2 approved-quote payment (Phase 6.4 Unit 6). Rendered only for the request
// owner on a v2 request; whether anything actually appears is decided entirely
// by server eligibility (never inferred from the quote status here). The amount
// shown is the server's own eligibility amount, which is the approved quote
// total - so "Payment amount" always matches "Approved quote". The client never
// sends an amount or currency: Pay Now just asks the server to create the
// checkout session and redirects to Stripe's hosted page. Verified completion
// happens server-side (webhook + /payment-success), never from this component.
//
// Owns its own card chrome and renders NOTHING (null) unless there is a genuine
// payable amount or a completed payment to confirm - so a request that is not
// yet payable adds no empty card to the page.
const Card = ({ children }) => (
    <div className="card bg-base-200 p-6 mt-8">
        <h3 className="text-2xl font-semibold mb-4">Payment</h3>
        {children}
    </div>
);

const V2PaymentSection = ({ requestId }) => {
    const axiosSecure = useAxiosSecure();
    const [redirecting, setRedirecting] = useState(false);
    const { data: eligibility, isLoading, isError } = usePaymentEligibility(requestId);

    // While checking or on a non-fatal error, add nothing to the page.
    if (isLoading || isError || !eligibility) {
        return null;
    }

    // Already paid: confirm calmly rather than offering a Pay Now the server
    // would only reject.
    if (!eligibility.eligible && eligibility.code === 'ALREADY_PAID') {
        return (
            <Card>
                <p className="flex items-center gap-2 text-success font-medium">
                    <FaCheckCircle aria-hidden="true" /> Payment completed for this repair request.
                </p>
            </Card>
        );
    }

    // Not payable yet (no quote, quote not approved/declined, wrong stage, …).
    // The Repair Quote section already communicates that state.
    if (!eligibility.eligible) {
        return null;
    }

    const handlePay = async () => {
        if (redirecting) return;
        setRedirecting(true);
        try {
            const { url } = await createV2Checkout(axiosSecure, requestId);
            if (!url) throw new Error('missing checkout url');
            // Hand off to Stripe's hosted checkout. Verified completion returns
            // to /dashboard/payment-success, which confirms with the server.
            window.location.href = url;
        } catch (error) {
            if (import.meta.env.DEV) console.error('V2 checkout creation failed:', error);
            Swal.fire({ icon: 'error', title: 'Could not start payment', text: getPaymentErrorMessage(error) });
            setRedirecting(false);
        }
    };

    return (
        <Card>
            <div className="space-y-3">
                <div className="rounded-lg bg-base-100 p-4 flex items-center justify-between gap-4">
                    <span className="opacity-70">Payment amount</span>
                    <span className="text-2xl font-bold text-primary">{formatMoney(eligibility.amount, eligibility.currency)}</span>
                </div>
                <button type="button" onClick={handlePay} disabled={redirecting} className="btn btn-primary w-full">
                    <FaCreditCard aria-hidden="true" /> {redirecting ? 'Starting payment…' : 'Pay Now'}
                </button>
                <p className="flex items-center justify-center gap-2 text-xs opacity-60">
                    <FaLock aria-hidden="true" /> Secure payment powered by Stripe
                </p>
            </div>
        </Card>
    );
};

export default V2PaymentSection;
