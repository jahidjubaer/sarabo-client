import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuth from '../../../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router';
import SocialLogin from '../SocialLogin/SocialLogin';
import Swal from 'sweetalert2';
import { getAuthErrorMessage } from '../../../utils/authErrorMessage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
            await signInUser(data.email, data.password);
            navigate(location?.state || '/');
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

    return (
        <div className="card bg-base-100 w-full mx-auto max-w-sm shrink-0 shadow-2xl">
            <h3 className="text-3xl font-bold text-center">Welcome back</h3>
            <p className='text-center'>Please Login</p>
            <form className="card-body" onSubmit={handleSubmit(handleLogin)}>
                <fieldset className="fieldset">
                    {/* email field */}
                    <label className="label">Email</label>
                    <input type="email" {...register('email', { required: true })} className="input" placeholder="Email" />
                    {
                        errors.email?.type === 'required' && <p className='text-red-500'>Email is required.</p>
                    }

                    {/* password field */}
                    <label className="label">Password</label>
                    <input type="password" {...register('password', { required: true, minLength: 6 })} className="input" placeholder="Password" />
                    {
                        errors.password?.type === 'minLength' && <p className='text-red-500'>Password must be 6 characters or longer.</p>
                    }

                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetting}
                        className="text-sm opacity-60 text-left underline w-fit">
                        {resetting ? 'Sending reset email...' : 'Forgot password?'}
                    </button>

                    <button disabled={submitting} className="btn btn-primary text-black mt-4">
                        {submitting ? 'Logging in...' : 'Login'}
                    </button>
                </fieldset>
                <p>New to Sarabo <Link
                    state={location.state}
                    className='text-blue-400 underline'
                    to="/register">Register</Link></p>
            </form>
            <SocialLogin></SocialLogin>
        </div>
    );
};

export default Login;
