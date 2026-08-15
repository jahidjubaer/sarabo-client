import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import SocialLogin from '../SocialLogin/SocialLogin';
import { getAuthErrorMessage } from '../../../utils/authErrorMessage';
import { isUserEmailVerified } from '../../../utils/emailVerification';
import { Input } from '../../../components/ui/input';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Login (Phase 6 - presentation migration only).
//
// Every behaviour below is the pre-existing one: the same react-hook-form
// rules, the same signInUser/resetPassword calls, the same Swal error surfaces,
// the same unverified-user routing to /verify-email, and the same
// `location.state` handling - both for the post-login navigate and for the
// Register link, which is what preserves a deep link's pathname + search
// through the auth round trip. Only the markup changed: DaisyUI's card /
// card-body / fieldset / input / btn are gone, replaced by the shared ds
// primitives already used by the rest of the redesigned app.
const Login = () => {
    const { register, handleSubmit, getValues, formState: { errors } } = useForm();
    const { signInUser, resetPassword } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleLogin = async (data) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await signInUser(data.email, data.password);
            // Unverified email/password users are routed to verification rather
            // than the protected flow (they still get an authenticated session
            // so they can resend/verify). The intended route is preserved so
            // they return here after verifying. Verified/Google users proceed
            // exactly as before. (Phase 8.1)
            if (result?.user && !isUserEmailVerified(result.user)) {
                navigate('/verify-email', { state: location?.state, replace: true });
            } else {
                navigate(location?.state || '/');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error('Login failed:', error);
            Swal.fire({ icon: 'error', title: 'Login failed', text: getAuthErrorMessage(error) });
            setSubmitting(false);
        }
    }

    const handleForgotPassword = async () => {
        if (resetting) return;
        const email = getValues('email');
        if (!email || !EMAIL_PATTERN.test(email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Enter your email first',
                text: 'Type a valid email address above, then click "Forgot password?" again.'
            });
            return;
        }
        setResetting(true);
        try {
            await resetPassword(email);
            Swal.fire({
                icon: 'success',
                title: 'Check your inbox',
                text: 'If an account exists for this email, a password reset link has been sent.'
            });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Password reset failed:', error);
            Swal.fire({ icon: 'error', title: 'Could not send reset email', text: getAuthErrorMessage(error) });
        } finally {
            setResetting(false);
        }
    }

    const emailError = errors.email?.type === 'required' ? 'Email is required.' : undefined;
    const passwordError = errors.password?.type === 'minLength'
        ? 'Password must be 6 characters or longer.'
        : undefined;

    return (
        <div>
            <h1 className="text-title text-ds-foreground">Welcome back</h1>
            <p className="mt-2 text-body-sm text-ds-muted-foreground">
                Sign in to submit a repair request and follow it through every stage.
            </p>

            {/* No `noValidate`: native constraint validation on type="email" is
                part of the current behaviour and is deliberately left in place. */}
            <form onSubmit={handleSubmit(handleLogin)} className="mt-8 flex flex-col gap-5">
                <FormField id="login-email" label="Email" required error={emailError}>
                    <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={emailError ? 'true' : undefined}
                        aria-describedby={emailError ? 'login-email-error' : undefined}
                        {...register('email', { required: true })}
                    />
                </FormField>

                <div>
                    <FormField id="login-password" label="Password" required error={passwordError}>
                        <Input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Your password"
                            aria-invalid={passwordError ? 'true' : undefined}
                            aria-describedby={passwordError ? 'login-password-error' : undefined}
                            {...register('password', { required: true, minLength: 6 })}
                        />
                    </FormField>

                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetting}
                        className="focus-ring mt-2 rounded-ds text-body-sm font-medium text-ds-primary underline-offset-4 hover:underline disabled:opacity-60"
                    >
                        {resetting ? 'Sending reset email...' : 'Forgot password?'}
                    </button>
                </div>

                <LoadingButton
                    type="submit"
                    variant="action"
                    size="lg"
                    loading={submitting}
                    loadingText="Logging in..."
                    className="w-full"
                >
                    Login
                </LoadingButton>
            </form>

            <SocialLogin />

            <p className="mt-8 border-t border-ds-border pt-6 text-body-sm text-ds-muted-foreground">
                New to Sarabo{' '}
                <Link
                    state={location.state}
                    to="/register"
                    className="focus-ring rounded-ds font-semibold text-ds-primary underline-offset-4 hover:underline"
                >
                    Register
                </Link>
            </p>
        </div>
    );
};

export default Login;
