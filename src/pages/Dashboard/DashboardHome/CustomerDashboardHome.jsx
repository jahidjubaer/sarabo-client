import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link } from 'react-router';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import Avatar from '../../../components/Avatar/Avatar';

const CustomerDashboardHome = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: requests = [], isLoading: requestsLoading } = useQuery({
        queryKey: ['my-requests', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels?email=${user.email}`);
            return res.data;
        }
    })

    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/payments?email=${user.email}`);
            return res.data;
        }
    })

    if (requestsLoading || paymentsLoading) {
        return <Loading></Loading>
    }

    const totalSpending = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedCount = requests.filter(r => r.deliveryStatus === 'parcel_delivered').length;
    const assignedCount = requests.filter(r => ['driver_assigned', 'rider_arriving', 'parcel_picked_up'].includes(r.deliveryStatus)).length;
    const pendingCount = requests.filter(r => !r.deliveryStatus || r.deliveryStatus === 'pending-pickup').length;

    const recentRequests = [...requests]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Avatar src={user?.photoURL} name={user?.displayName} />
                <div>
                    <h2 className="text-4xl font-bold">Welcome, {user?.displayName}</h2>
                    <p className="opacity-70">{user?.email}</p>
                </div>
            </div>

            <div className="stats shadow flex-wrap">
                <div className="stat">
                    <div className="stat-title">Total Requests</div>
                    <div className="stat-value">{requests.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Pending</div>
                    <div className="stat-value">{pendingCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Assigned</div>
                    <div className="stat-value">{assignedCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Completed</div>
                    <div className="stat-value">{completedCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Total Spending</div>
                    <div className="stat-value">${totalSpending}</div>
                </div>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-4">Recent Activity</h3>
            {
                recentRequests.length === 0 ? (
                    <p className="opacity-60">No repair requests yet. <Link to="/dashboard/create-request" className="link">Create your first request</Link>.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Device</th>
                                    <th>Status</th>
                                    <th>Cost</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map(r => (
                                    <tr key={r._id}>
                                        <td>{r.parcelName}</td>
                                        <td><StatusBadge status={r.deliveryStatus || 'pending-pickup'} /></td>
                                        <td>${r.cost}</td>
                                        <td><Link to={`/dashboard/my-requests/${r._id}`} className="link">View</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div>
    );
};

export default CustomerDashboardHome;
