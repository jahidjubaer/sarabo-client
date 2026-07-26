import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuth from '../../../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router';
import SocialLogin from '../SocialLogin/SocialLogin';
import axios from 'axios';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { getAuthErrorMessage, getSyncErrorMessage } from '../../../utils/authErrorMessage';

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { registerUser, updateUserProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();
    const [submitting, setSubmitting] = useState(false);
    const [pendingUserInfo, setPendingUserInfo] = useState(null);
    const [syncFailed, setSyncFailed] = useState(false);

    const syncUserToBackend = async (userInfo) => {
        await axiosSecure.post('/users', userInfo);
        navigate(location.state || '/');
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
        } catch (error) {
            if (import.meta.env.DEV) console.error('Retry sync failed:', error);
            Swal.fire({ icon: 'error', title: 'Still unable to finish setup', text: getSyncErrorMessage() });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card bg-base-100 w-full mx-auto max-w-sm shrink-0 shadow-2xl">
            <h3 className="text-3xl font-bold text-center">Welcome to Sarabo</h3>
            <p className='text-center'>Please Register</p>
            {syncFailed && (
                <div className="alert alert-warning mx-6 mb-2 text-sm">
                    <span>
                        Your account was created, but we couldn't finish setting up your profile.{' '}
                        <button type="button" onClick={handleRetrySync} disabled={submitting} className="underline font-semibold">
                            {submitting ? 'Retrying...' : 'Retry'}
                        </button>
                    </span>
                </div>
            )}
            <form className="card-body" onSubmit={handleSubmit(handleRegistration)}>
                <fieldset className="fieldset">
                    {/* name field */}
                    <label className="label">Name</label>
                    <input type="text"
                        {...register('name', { required: true })}
                        className="input"
                        placeholder="Your Name" />
                    {errors.name?.type === 'required' && <p className='text-red-500'>Name is required.</p>}

                    {/* photo image field */}
                    <label className="label">Photo</label>

                    <input type="file" {...register('photo', { required: true })} className="file-input" placeholder="Your Photo" />

                    {errors.photo?.type === 'required' && <p className='text-red-500'>Photo is required.</p>}

                    {/* email field */}
                    <label className="label">Email</label>
                    <input type="email" {...register('email', { required: true })} className="input" placeholder="Email" />
                    {errors.email?.type === 'required' && <p className='text-red-500'>Email is required.</p>}

                    {/* password */}
                    <label className="label">Password</label>
                    <input type="password" {...register('password', {
                        required: true,
                        minLength: 6,
                        pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
                    })} className="input" placeholder="Password" />
                    {
                        errors.password?.type === 'required' && <p className='text-red-500'>Password is required.</p>
                    }
                    {
                        errors.password?.type === 'minLength' && <p className='text-red-500'>
                            Password must be 6 characters or longer.
                        </p>
                    }
                    {
                        errors.password?.type === 'pattern' && <p className='text-red-500'>Password must have at least one uppercase, at least one lowercase, at least one number, and at least one special character.</p>
                    }

                    <div className="tooltip" data-tip="Password reset is not available yet">
                        <span className="text-sm opacity-60">Forgot password?</span>
                    </div>
                    <button disabled={submitting} className="btn btn-primary text-black mt-4">
                        {submitting ? 'Creating account...' : 'Register'}
                    </button>
                </fieldset>
                <p>Already have an account <Link
                    state={location.state}
                    className='text-blue-400 underline'
                    to="/login">Login</Link></p>
            </form>
            <SocialLogin></SocialLogin>
        </div>
    );
};

export default Register;
