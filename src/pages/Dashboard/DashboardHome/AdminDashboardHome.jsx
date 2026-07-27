import { useQuery } from '@tanstack/react-query';
import React from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { Legend, Pie, PieChart, Tooltip } from 'recharts';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';

const AdminDashboardHome = () => {
    const axiosSecure = useAxiosSecure();
    const { data: statusStats = [], isLoading } = useQuery({
        queryKey: ['request-status-stats'],
        queryFn: async () => {
            const res = await axiosSecure.get('/parcels/delivery-status/stats');
            return res.data;
        }
    })

    const { data: allRequests = [], isLoading: requestsLoading } = useQuery({
        queryKey: ['admin-all-requests'],
        queryFn: async () => (await axiosSecure.get('/parcels')).data
    })

    const { data: allTechnicians = [], isLoading: techniciansLoading } = useQuery({
        queryKey: ['admin-all-technicians'],
        queryFn: async () => (await axiosSecure.get('/riders')).data
    })

    const { data: pendingTechnicians = [], isLoading: pendingLoading } = useQuery({
        queryKey: ['admin-pending-technicians'],
        queryFn: async () => (await axiosSecure.get('/riders?status=pending')).data
    })

    // GET /users currently caps results at 5 server-side (no pagination support yet);
    // shown as a labeled placeholder rather than an authoritative total customer count
    const { data: recentUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['admin-recent-users'],
        queryFn: async () => (await axiosSecure.get('/users')).data
    })

    const { data: allPayments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['admin-all-payments'],
        queryFn: async () => (await axiosSecure.get('/payments')).data
    })

    if (isLoading || requestsLoading || techniciansLoading || pendingLoading || usersLoading || paymentsLoading) {
        return <Loading></Loading>
    }

    const revenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const getPieChartData = data =>{
        return data.map(item => {
            return {name: getRepairStatusLabel(item.status), value: item.count}
        })
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Admin Dashboard</h2>

            <div className="stats shadow flex-wrap mt-6">
                <div className="stat">
                    <div className="stat-title">Total Repair Requests</div>
                    <div className="stat-value">{allRequests.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Total Technicians</div>
                    <div className="stat-value">{allTechnicians.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Pending Approvals</div>
                    <div className="stat-value">{pendingTechnicians.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Recent Customers</div>
                    <div className="stat-value">{recentUsers.length}</div>
                    <div className="stat-desc">Showing latest {recentUsers.length} — full count needs backend pagination</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Revenue</div>
                    <div className="stat-value">{formatCurrency(revenue)}</div>
                </div>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-2">Repair Requests by Status</h3>
            <div className="stats shadow flex-wrap">
                {
                    statusStats.map(stat => <div key={stat._id} className="stat">
                        <div className="stat-figure text-secondary">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="inline-block h-8 w-8 stroke-current"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                        </div>
                        <div className="stat-title text-2xl"><StatusBadge status={stat._id} label={getRepairStatusLabel(stat._id)} /></div>
                        <div className="stat-value">{stat.count}</div>
                    </div>)
                }

            </div>
            <div className='w-full h-[400px]'>
                <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 2 }} responsive>
                    <Pie
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        data={getPieChartData(statusStats)}
                        cx="50%"
                        cy="100%"
                        outerRadius="120%"
                        fill="#8884d8"
                        label
                        isAnimationActive={true}
                    />
                    <Legend></Legend>
                    <Tooltip></Tooltip>
                </PieChart>
            </div>
        </div>
    );
};

export default AdminDashboardHome;