import { Link } from 'react-router';
import { CircleSlash } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { buttonVariants } from '../../../components/ui/button-variants';

// Phase 12: design-system alignment only. The semantics are unchanged and
// deliberately narrow - the customer cancelled at Stripe, so nothing was
// charged. It never says the payment "failed", never promises a refund, and
// never implies the repair request itself was affected.
const PaymentCancelled = () => {
    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 text-center sm:p-7">
                <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full bg-ds-muted text-ds-muted-foreground">
                    <CircleSlash className="size-6" />
                </span>
                <h1 className="mt-4 text-heading text-ds-foreground">Payment cancelled</h1>
                <p className="mt-2 text-body-sm text-ds-muted-foreground">
                    Payment cancelled - no charge was recorded.
                    You can try again anytime from My Repair Requests.
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Link to="/dashboard/my-requests" className={`${buttonVariants()} flex-1`}>Return to my repair requests</Link>
                    <Link to="/dashboard" className={`${buttonVariants({ variant: 'outline' })} flex-1`}>Go to dashboard</Link>
                </div>
            </Card>
        </div>
    );
};

export default PaymentCancelled;
