import { Suspense, lazy } from 'react';
import useRole from '../../../hooks/useRole';
import Loading from '../../../components/Loading/Loading';
import RoleError from '../../../components/RoleError/RoleError';
import TechnicianDashboardHome from './TechnicianDashboardHome';
import CustomerDashboardHome from './CustomerDashboardHome';

// Phase 8.3: the admin dashboard home is the only surface that pulls in Recharts
// (a sizeable, admin-only dependency). Lazy-loading it moves Recharts into its
// own chunk that non-admins never download, trimming the initial bundle without
// touching routing or the auth guards. Customer/technician homes stay eagerly
// loaded (they are the common path). Suspense falls back to the shared loader
// while the chunk arrives.
const AdminDashboardHome = lazy(() => import('./AdminDashboardHome'));

const DashboardHome = () => {
    const { role, roleLoading, isError } = useRole();
    if (roleLoading) {
        return <Loading></Loading>;
    }
    // A failed role lookup must never be treated as "customer" by default.
    if (isError) {
        return <RoleError></RoleError>;
    }
    if (role === 'admin') {
        return (
            <Suspense fallback={<Loading />}>
                <AdminDashboardHome />
            </Suspense>
        );
    }
    else if (role === 'rider') {
        return <TechnicianDashboardHome></TechnicianDashboardHome>;
    }
    else {
        return <CustomerDashboardHome></CustomerDashboardHome>;
    }
};

export default DashboardHome;
