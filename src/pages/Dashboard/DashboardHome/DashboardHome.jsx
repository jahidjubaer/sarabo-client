import React from 'react';
import useRole from '../../../hooks/useRole';
import Loading from '../../../components/Loading/Loading';
import AdminDashboardHome from './AdminDashboardHome';
import TechnicianDashboardHome from './TechnicianDashboardHome';
import CustomerDashboardHome from './CustomerDashboardHome';

const DashboardHome = () => {
    const { role, roleLoading } = useRole();
    if (roleLoading) {
        return <Loading></Loading>
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