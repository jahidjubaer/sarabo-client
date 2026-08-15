import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { getAuthErrorMessage, getSyncErrorMessage } from '../../../utils/authErrorMessage';
import { LoadingButton } from '../../../components/common/LoadingButton';

// Social login (Phase 6 - presentation migration only).
//
// Google is the only provider and stays the only provider. The sign-in call,
// the /users sync, the deliberate decision NOT to sign the user out when that
// sync fails, the Swal surfaces and the `location.state` navigation are all
// unchanged. Only DaisyUI's `btn` wrapper was replaced by the shared button,
// and the "OR" line became a proper labelled divider.
const SocialLogin = () => {
    const { signInGoogle } = useAuth();
    const axiosSecure = useAxiosSecure();
    const location = useLocation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleGoogleSignIn = async () => {
        if (submitting) return;
        setSubmitting(true);

        let result;
        try {
            result = await signInGoogle();
        } catch (error) {
            if (import.meta.env.DEV) console.error('Google sign-in failed:', error);
            Swal.fire({ icon: 'error', title: 'Google sign-in failed', text: getAuthErrorMessage(error) });
            setSubmitting(false);
            return;
        }

        const userInfo = {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
        };

        try {
            await axiosSecure.post('/users', userInfo);
            navigate(location.state || '/');
        } catch (error) {
            if (import.meta.env.DEV) console.error('Backend sync failed:', error);
            // Firebase sign-in already succeeded at this point, so the user is
            // genuinely authenticated - signing them out here would just discard
            // a valid session over a server-side hiccup. Keep them signed in and
            // let them retry (a repeat click re-runs the same idempotent sync)
            // rather than navigating anywhere until it succeeds.
            Swal.fire({
                icon: 'error',
                title: 'Could not finish setting up your account',
                text: getSyncErrorMessage()
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-6">
            <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-ds-border" />
                <span className="ds-label text-ds-muted-foreground">or</span>
                <span className="h-px flex-1 bg-ds-border" />
            </div>

            <LoadingButton
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                loading={submitting}
                loadingText="Signing in..."
                className="mt-4 w-full"
            >
                <svg aria-hidden="true" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                Login with Google
            </LoadingButton>
        </div>
    );
};

export default SocialLogin;
