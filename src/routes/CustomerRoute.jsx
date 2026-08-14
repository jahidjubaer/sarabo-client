import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import { Navigate, useLocation } from 'react-router';
import Loading from '../components/Loading/Loading';
import Forbidden from '../components/Forbidden/Forbidden';
import RoleError from '../components/RoleError/RoleError';
import { isUserEmailVerified } from '../utils/emailVerification';

// Guards customer-only actions (create/view/pay for your own repair
// requests) that previously relied on authentication alone via PrivateRoute,
// which would let an authenticated admin/rider account reach them too.
//
// Phase 8.1: pass `requireVerified` to also gate on a verified email. When set,
// an authenticated customer whose email is not verified is redirected to
// /verify-email (preserving the intended destination) instead of being allowed
// through. This is a UX guard only - the server's verifyEmailVerified
// middleware is the authoritative gate for the underlying mutations. Google
// users report emailVerified: true and pass unaffected.
const CustomerRoute = ({ children, requireVerified = false }) => {
    const { loading, user } = useAuth();
    const location = useLocation();
    const { role, roleLoading, isError } = useRole();

    if (loading || roleLoading) {
        return <Loading></Loading>;
    }

    if (!user) {
        // Phase 2 (approved fix): preserve the query string alongside the path
        // so a category deep link survives login. See PrivateRoute for the full
        // rationale. Authorization semantics are untouched.
        return <Navigate state={`${location.pathname}${location.search}`} to="/login"></Navigate>;
    }

    if (isError) {
        return <RoleError></RoleError>;
    }

    if (role !== 'user') {
        return <Forbidden></Forbidden>;
    }

    if (requireVerified && !isUserEmailVerified(user)) {
        // Same rationale: the intended destination keeps its query string
        // across the verification detour too, otherwise a deep link that
        // survived login would still be lost here.
        return <Navigate state={`${location.pathname}${location.search}`} to="/verify-email"></Navigate>;
    }

    return children;
};

export default CustomerRoute;
