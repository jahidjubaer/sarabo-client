import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import SocialLogin from '../SocialLogin/SocialLogin';
import { getAuthErrorMessage, getSyncErrorMessage } from '../../../utils/authErrorMessage';
import { Input } from '../../../components/ui/input';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { cn } from '../../../lib/utils';

// Register (Phase 6 - presentation migration only).
//
// The four existing fields (name, photo, email, password) and every existing
// react-hook-form rule are unchanged, including the password pattern. The
// four-step submit - imgbb upload, Firebase account, profile update, backend
// /users sync - is untouched, as is the sync-failure retry path and the
// routing to /verify-email with `location.state` preserved.
//
// Removed with the DaisyUI markup: a `tooltip` reading "Password reset is not
// available yet". It was a non-interactive decoration and the statement is no
// longer true - Login has a working reset - so it is not carried over. No
// behaviour is attached to it.
const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { registerUser, updateUserProfile, sendVerificationEmail } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();
    const [submitting, setSubmitting] = useState(false);
    const [pendingUserInfo, setPendingUserInfo] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);

    // Backend upsert only - navigation is handled by finishRegistration so the
    // user is always routed to verification (never straight into the app) after
    // a successful email/password registration. (Phase 8.1)
    const syncUserToBackend = async (userInfo) => {
        await axiosSecure.post('/users', userInfo);
    }

    // After the account + backend record exist, send the Firebase verification
    // link (best-effort: the account already exists, so a send failure must not
    // read as a failed registration - the user can resend on the verify page)
    // and move the user into the verification-required screen, preserving their
    // intended destination.
    const finishRegistration = async () => {
        try {
            await sendVerificationEmail();
        } catch (error) {
            if (import.meta.env.DEV) console.error('Verification email send failed:', error);
        }
        navigate('/verify-email', { state: location.state, replace: true });
    }

    // react-hook-form's own required/pattern rules (below) already block this
    // handler from running until the form passes validation.
    const handleRegistration = async (data) => {
        if (submitting) return;
        setSubmitting(true);
        setSyncFailed(false);

        const profileImg = data.photo[0];
        let photoURL;

        // 1. Upload the photo before creating the Firebase account, so a failed
        // upload never leaves behind an account that's already been created.
        try {
            const formData = new FormData();
            formData.append('image', profileImg);
            const image_API_URL = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_image_host_key}`;
            const uploadRes = await axios.post(image_API_URL, formData);
            photoURL = uploadRes.data.data.url;
        } catch (error) {
            if (import.meta.env.DEV) console.error('Image upload failed:', error);
            Swal.fire({ icon: 'error', title: 'Photo upload failed', text: 'Please try again.' });
            setSubmitting(false);
            return;
        }

        // 2. Create the Firebase account.
        try {
            await registerUser(data.email, data.password);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Registration failed:', error);
            Swal.fire({ icon: 'error', title: 'Registration failed', text: getAuthErrorMessage(error) });
            setSubmitting(false);
            return;
        }

        // 3. Update the Firebase profile. Non-fatal on failure: the account
        // already exists and the backend sync below sends displayName/photoURL
        // from the form data directly, so it doesn't depend on this succeeding.
        try {
            await updateUserProfile({ displayName: data.name, photoURL });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Firebase profile update failed:', error);
        }

        // 4. Sync the user into the backend database. Only navigate once this
        // succeeds - never redirect as if registration finished when it hasn't.
        const userInfo = {
            email: data.email,
            displayName: data.name,
            photoURL: photoURL
        };

        try {
            await syncUserToBackend(userInfo);
            await finishRegistration();
        } catch (error) {
            if (import.meta.env.DEV) console.error('Backend sync failed:', error);
            setPendingUserInfo(userInfo);
            setSyncFailed(true);
            Swal.fire({ icon: 'error', title: 'Almost there', text: getSyncErrorMessage() });
        } finally {
            setSubmitting(false);
        }
    }

    const handleRetrySync = async () => {
        if (!pendingUserInfo || submitting) return;
        setSubmitting(true);
        try {
            await syncUserToBackend(pendingUserInfo);
            await finishRegistration();
        } catch (error) {
            if (import.meta.env.DEV) console.error('Retry sync failed:', error);
            Swal.fire({ icon: 'error', title: 'Still unable to finish setup', text: getSyncErrorMessage() });
        } finally {
            setSubmitting(false);
        }
    }

    const nameError = errors.name?.type === 'required' ? 'Name is required.' : undefined;
    const photoError = errors.photo?.type === 'required' ? 'Photo is required.' : undefined;
    const emailError = errors.email?.type === 'required' ? 'Email is required.' : undefined;
    const passwordError = errors.password?.type === 'required'
        ? 'Password is required.'
        : errors.password?.type === 'minLength'
            ? 'Password must be 6 characters or longer.'
            : errors.password?.type === 'pattern'
                ? 'Password must have at least one uppercase, at least one lowercase, at least one number, and at least one special character.'
                : undefined;

    return (
        <div>
            <h1 className="text-title text-ds-foreground">Welcome to Sarabo</h1>
            <p className="mt-2 text-body-sm text-ds-muted-foreground">
                Create an account to request a repair and track it through every stage.
            </p>

            {syncFailed && (
                <div role="alert" className="mt-6 rounded-ds border border-ds-border bg-ds-accent/50 px-4 py-3 text-body-sm text-ds-accent-foreground">
                    Your account was created, but we couldn't finish setting up your profile.{' '}
                    <button
                        type="button"
                        onClick={handleRetrySync}
                        disabled={submitting}
                        className="focus-ring rounded-ds font-semibold underline underline-offset-4 disabled:opacity-60"
                    >
                        {submitting ? 'Retrying...' : 'Retry'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit(handleRegistration)} className="mt-8 flex flex-col gap-5">
                <FormField id="register-name" label="Name" required error={nameError}>
                    <Input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        aria-invalid={nameError ? 'true' : undefined}
                        aria-describedby={nameError ? 'register-name-error' : undefined}
                        {...register('name', { required: true })}
                    />
                </FormField>

                <FormField id="register-photo" label="Photo" required error={photoError}>
                    <Input
                        id="register-photo"
                        type="file"
                        aria-invalid={photoError ? 'true' : undefined}
                        aria-describedby={photoError ? 'register-photo-error' : undefined}
                        className={cn(
                            'h-auto py-2 file:mr-3 file:rounded-ds file:border-0 file:bg-ds-muted',
                            'file:px-3 file:py-1.5 file:text-body-sm file:font-semibold file:text-ds-foreground'
                        )}
                        {...register('photo', { required: true })}
                    />
                </FormField>

                <FormField id="register-email" label="Email" required error={emailError}>
                    <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={emailError ? 'true' : undefined}
                        aria-describedby={emailError ? 'register-email-error' : undefined}
                        {...register('email', { required: true })}
                    />
                </FormField>

                <FormField id="register-password" label="Password" required error={passwordError}>
                    <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        aria-invalid={passwordError ? 'true' : undefined}
                        aria-describedby={passwordError ? 'register-password-error' : undefined}
                        {...register('password', {
                            required: true,
                            minLength: 6,
                            pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
                        })}
                    />
                </FormField>

                <LoadingButton
                    type="submit"
                    variant="action"
                    size="lg"
                    loading={submitting}
                    loadingText="Creating account..."
                    className="w-full"
                >
                    Register
                </LoadingButton>
            </form>

            <SocialLogin />

            <p className="mt-8 border-t border-ds-border pt-6 text-body-sm text-ds-muted-foreground">
                Already have an account{' '}
                <Link
                    state={location.state}
                    to="/login"
                    className="focus-ring rounded-ds font-semibold text-ds-primary underline-offset-4 hover:underline"
                >
                    Login
                </Link>
            </p>
        </div>
    );
};

export default Register;
