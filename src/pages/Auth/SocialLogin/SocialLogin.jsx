import React, { useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';
import { getAuthErrorMessage, getSyncErrorMessage } from '../../../utils/authErrorMessage';

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
        <div className='text-center pb-8'>
            <p className='mb-2'>OR</p>
            <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="btn bg-white text-black border-[#e5e5e5]">
                <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                {submitting ? 'Signing in...' : 'Login with Google'}
            </button>
        </div>
    );
};

export default SocialLogin;
