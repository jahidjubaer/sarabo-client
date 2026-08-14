import React from 'react';
import useAuth from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router';
import Loading from '../components/Loading/Loading';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    if (loading) {
        return <Loading></Loading>
    }

    if(!user){
        // Phase 2 (approved fix): carry the query string through login as well
        // as the path, so a deep link such as
        // /dashboard/create-request?category=smartphone still arrives with its
        // parameter after authenticating.
        //
        // NAVIGATION STATE ONLY. Who may enter, which role is required and
        // where the redirect goes are all unchanged - this is just the "where
        // was I heading" hint that Login navigates back to, and it stays a
        // same-origin relative path.
        return <Navigate state={`${location.pathname}${location.search}`} to="/login"></Navigate>
    }

    return children;
};

export default PrivateRoute;