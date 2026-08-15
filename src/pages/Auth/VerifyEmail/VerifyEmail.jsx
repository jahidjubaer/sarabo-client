import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { notify } from '../../../lib/notify';
import { Button } from '../../../components/ui/button';
import { LoadingButton } from '../../../components/common/LoadingButton';
import {
    isUserEmailVerified, sanitizeInternalPath, getResendCooldownRemaining,
    getVerificationErrorMessage, RESEND_COOLDOWN_SECONDS,
} from '../../../utils/emailVerification';

// Dedicated email-verification screen (Phase 8.1). Firebase verification is
// link-based - there is NO OTP input. An authenticated but unverified user
// lands here; a verified user is bounced to their intended destination. The
// server (verifyEmailVerified) is the real gate for sensitive actions; this
// page is the UX to get verified and re-check.
const VerifyEmail = () => {
    const { user, loading, sendVerificationEmail, refreshCurrentUser, logOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const intended = sanitizeInternalPath(location.state, '/dashboard');
    const [checking, setChecking] = useState(false);
    const [resending, setResending] = useState(false);
    const [lastSentAt, setLastSentAt] = useState(null);
    const [cooldown, setCooldown] = useState(0);

    // Live cooldown countdown (UX only). Cleaned up on unmount / when it ends.
    useEffect(() => {
        if (!lastSentAt) return undefined;
        const tick = () => setCooldown(getResendCooldownRemaining(lastSentAt));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lastSentAt]);

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace state={location.state} />;
    // Already verified (e.g. Google, or refreshed elsewhere) - don't linger here.
    if (isUserEmailVerified(user)) return <Navigate to={intended} replace />;

    const handleResend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        try {
            await sendVerificationEmail();
            setLastSentAt(Date.now());
            setCooldown(RESEND_COOLDOWN_SECONDS);
            notify.success('Verification email sent. Check your inbox (and spam folder).');
        } catch (error) {
            if (import.meta.env.DEV) console.error('Resend verification failed:', error);
            notify.error(getVerificationErrorMessage(error));
        } finally {
            setResending(false);
        }
    };

    const handleCheckAgain = async () => {
        if (checking) return;
        setChecking(true);
        try {
            const verified = await refreshCurrentUser();
            if (verified) {
                notify.success('Email verified. Welcome to Sarabo!');
                navigate(intended, { replace: true });
            } else {
                notify.info('Not verified yet. Open the link in your email, then check again.');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error('Verification check failed:', error);
            notify.error(getVerificationErrorMessage(error));
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = () => {
        logOut()
            .then(() => navigate('/login', { replace: true }))
            .catch((error) => { if (import.meta.env.DEV) console.error('Logout failed:', error.message); });
    };

    return (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ds-primary/10 text-ds-primary">
                    <MailCheck aria-hidden="true" className="size-7" />
                </span>
                <h1 className="mt-4 text-title text-ds-foreground">Verify your email</h1>
                <p className="mt-3 text-body-sm text-ds-muted-foreground">
                    We sent a verification link to
                </p>
                <p className="ds-numeric mt-1 break-all text-body-sm font-semibold text-ds-foreground">{user.email}</p>
                <p className="mt-3 text-body-sm text-ds-muted-foreground">
                    Open that link to confirm your address, then come back and choose “I’ve verified”. Verification is required before you can submit repair requests or make payments.
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    <LoadingButton variant="action" size="lg" onClick={handleCheckAgain} loading={checking} loadingText="Checking…" className="w-full">
                        <RefreshCw aria-hidden="true" /> I’ve verified — check again
                    </LoadingButton>
                    <Button variant="outline" size="lg" onClick={handleResend} disabled={resending || cooldown > 0} className="w-full">
                        {resending ? 'Sending…' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
                    </Button>
                </div>

                {/* Accessible live status for the cooldown, without visual noise. */}
                <p aria-live="polite" className="sr-only">
                    {cooldown > 0 ? `Resend available in ${cooldown} seconds.` : 'Resend is available.'}
                </p>

                <div className="mt-6 border-t border-ds-border pt-4">
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-ds-muted-foreground">
                        <LogOut aria-hidden="true" /> Log out / use a different account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
