import React from 'react';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import { Navigate, useLocation } from 'react-router';
import Loading from '../components/Loading/Loading';
import Forbidden from '../components/Forbidden/Forbidden';
import RoleError from '../components/RoleError/RoleError';

// Guards customer-only actions (create/view/pay for your own repair
// requests) that previously relied on authentication alone via PrivateRoute,
// which would let an authenticated admin/rider account reach them too.
const CustomerRoute = ({ children }) => {
    const { loading, user } = useAuth();
    const location = useLocation();
    const { role, roleLoading, isError } = useRole()

    if (loading || roleLoading) {
        return <Loading></Loading>
    }

    if (!user) {
        return <Navigate state={location.pathname} to="/login"></Navigate>
    }

    if (isError) {
        return <RoleError></RoleError>
    }

    if (role !== 'user') {
        return <Forbidden></Forbidden>
    }

    return children;
};

export default CustomerRoute;
