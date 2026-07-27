import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link } from 'react-router';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';

// Estimated only: no backend earnings field exists yet: not persisted, for display purposes
const estimatePayout = job => job.senderDistrict === job.receiverDistrict ? job.cost * 0.8 : job.cost * 0.6;

const TechnicianDashboardHome = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: activeJobs = [], isLoading: activeLoading } = useQuery({
        queryKey: ['tech-active-jobs', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/rider?riderEmail=${user.email}`);
            return res.data;
        }
    })

    const { data: completedJobs = [], isLoading: completedLoading } = useQuery({
        queryKey: ['tech-completed-jobs', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/rider?riderEmail=${user.email}&deliveryStatus=parcel_delivered`);
            return res.data;
        }
    })

    if (activeLoading || completedLoading) {
        return <Loading></Loading>
    }

    const ongoingCount = activeJobs.filter(j => j.deliveryStatus !== 'driver_assigned').length;
    const assignedCount = activeJobs.filter(j => j.deliveryStatus === 'driver_assigned').length;
    const estimatedEarnings = completedJobs.reduce((sum, j) => sum + estimatePayout(j), 0);

    const recentJobs = [...activeJobs, ...completedJobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="avatar">
                    <div className="w-16 h-16 rounded-full">
                        <img src={user?.photoURL} alt="" />
                    </div>
                </div>
                <div>
                    <h2 className="text-4xl font-bold">Welcome, {user?.displayName}</h2>
                    <p className="opacity-70">{user?.email}</p>
                </div>
            </div>

            <div className="stats shadow flex-wrap">
                <div className="stat">
                    <div className="stat-title">Assigned Repairs</div>
                    <div className="stat-value">{assignedCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Ongoing Repairs</div>
                    <div className="stat-value">{ongoingCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Completed Repairs</div>
                    <div className="stat-value">{completedJobs.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Estimated Earnings</div>
                    <div className="stat-value">{formatCurrency(estimatedEarnings)}</div>
                    <div className="stat-desc">Estimate only — not a persisted ledger value</div>
                </div>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-4">Recent Repairs</h3>
            {
                recentJobs.length === 0 ? (
                    <p className="opacity-60">No repairs assigned yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Device</th>
                                    <th>Status</th>
                                    <th>District</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map(j => (
                                    <tr key={j._id}>
                                        <td>{j.parcelName}</td>
                                        <td><StatusBadge status={j.deliveryStatus || 'pending-pickup'} label={getRepairStatusLabel(j.deliveryStatus)} /></td>
                                        <td>{j.senderDistrict}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }
            <div className="mt-6 flex gap-3">
                <Link to="/dashboard/assigned-jobs" className="btn btn-primary text-black">View Assigned Repairs</Link>
                <Link to="/dashboard/completed-jobs" className="btn">View Completed Repairs</Link>
            </div>
        </div>
    );
};

export default TechnicianDashboardHome;
