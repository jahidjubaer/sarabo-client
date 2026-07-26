import axios from 'axios';
import React, { useEffect } from 'react';
import useAuth from './useAuth';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../config/api';

const axiosSecure = axios.create({
    baseURL: API_BASE_URL
})

// Shared across all useAxiosSecure instances (there is only one real session at
// a time) so parallel failing requests don't each trigger their own logout.
let isHandlingSessionExpiry = false;

const useAxiosSecure = () => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // intercept request: always attach a fresh Firebase ID token, never the
        // stale/undocumented user.accessToken field. getIdToken() returns the
        // cached token unless it's expired/near-expiry, in which case the SDK
        // refreshes it automatically.
        const reqInterceptor = axiosSecure.interceptors.request.use(async config => {
            if (user) {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        })

        // interceptor response
        const resInterceptor = axiosSecure.interceptors.response.use((response) => {
            return response;
        }, async (error) => {
            const statusCode = error.response?.status ?? error.status;
            const originalRequest = error.config;

            // 401: attempt exactly one forced token refresh + retry before giving up.
            if (statusCode === 401 && user && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const freshToken = await user.getIdToken(true);
                    originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                    return await axiosSecure(originalRequest);
                } catch {
                    // refresh failed, or the retried request also failed -> fall
                    // through to the confirmed-invalid-session logout below.
                }
            }

            // Only treat as a confirmed invalid session (not just a stale token)
            // once a refresh+retry has already been attempted (or there's no user
            // to refresh for). 403 (authenticated but forbidden) never logs out.
            if (statusCode === 401 && !isHandlingSessionExpiry) {
                isHandlingSessionExpiry = true;
                logOut()
                    .then(() => {
                        navigate('/login')
                    })
                    .finally(() => {
                        isHandlingSessionExpiry = false;
                    })
            }

            return Promise.reject(error);
        })

        return () => {
            axiosSecure.interceptors.request.eject(reqInterceptor);
            axiosSecure.interceptors.response.eject(resInterceptor);
        }

    }, [user, logOut, navigate])

    return axiosSecure;
};

export default useAxiosSecure;
