import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { needsEmailVerification } from '../../utils/emailVerification';

// Slim, non-blocking dashboard banner (Phase 8.1). Shown once at the top of the
// dashboard content only while the signed-in user's email is unverified - it is
// awareness, not enforcement (route guards + the server verifyEmailVerified
// middleware are the actual gates). Not dismissible: it is a standing prompt
// until the account is verified, not a marketing message. Rendered once by the
// shell, so it never plasters every page.
const DashboardVerificationBanner = () => {
    const { user } = useAuth();
    if (!needsEmailVerification(user)) return null;

    return (
        <div
            role="status"
            className="mb-6 flex flex-col gap-2 rounded-ds-lg border border-ds-warning/30 bg-ds-warning/10 p-4 text-body-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-start gap-2.5">
                <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-warning" />
                <p className="text-ds-foreground">
                    <span className="font-semibold">Verify your email</span> to submit repair requests and make payments.
                </p>
            </div>
            <Link to="/verify-email" className="focus-ring shrink-0 rounded-ds font-semibold text-ds-primary underline underline-offset-4">
                Verify now
            </Link>
        </div>
    );
};

export default DashboardVerificationBanner;
