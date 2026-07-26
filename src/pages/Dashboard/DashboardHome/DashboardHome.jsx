import React from 'react';
import useRole from '../../../hooks/useRole';
import Loading from '../../../components/Loading/Loading';
import RoleError from '../../../components/RoleError/RoleError';
import AdminDashboardHome from './AdminDashboardHome';
import TechnicianDashboardHome from './TechnicianDashboardHome';
import CustomerDashboardHome from './CustomerDashboardHome';

const DashboardHome = () => {
    const { role, roleLoading, isError } = useRole();
    if (roleLoading) {
        return <Loading></Loading>
    }
    // A failed role lookup must never be treated as "customer" by default.
    if (isError) {
        return <RoleError></RoleError>
    }
    if (role === 'admin') {
        return <AdminDashboardHome></AdminDashboardHome>
    }
    else if (role === 'rider') {
        return <TechnicianDashboardHome></TechnicianDashboardHome>
    }
    else {
        return <CustomerDashboardHome></CustomerDashboardHome>
    }
};

export default DashboardHome;