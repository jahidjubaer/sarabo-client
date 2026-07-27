import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { FiEdit } from 'react-icons/fi';
import { FaBan } from 'react-icons/fa6';
import { FaEye, FaCreditCard } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { Link } from 'react-router';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { canCancelRequest } from '../../../utils/cancellationEligibility';

const MyRequests = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [payingId, setPayingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const { data: requests = [], refetch, isLoading } = useQuery({
        queryKey: ['my-requests', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels?email=${user.email}`);
            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    const statusOptions = [...new Set(requests.map(r => r.deliveryStatus).filter(Boolean))];

    const filteredRequests = requests.filter(r => {
        const matchesSearch = !searchText ||
            (r.parcelName || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (r.trackingId || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (r.senderPhone || '').includes(searchText);
        const matchesStatus = statusFilter === 'all' || r.deliveryStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCancelRequest = request => {
        if (cancellingId) return;

        Swal.fire({
            title: 'Cancel this repair request?',
            text: "This is final - once cancelled, this request cannot be reopened. Assigned or in-progress repairs can no longer be cancelled here, and paid requests require support for cancellation or a refund.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel request'
        }).then(result => {
            if (!result.isConfirmed) return;

            setCancellingId(request._id);
            axiosSecure.patch(`/parcels/${request._id}/cancel`)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                    queryClient.invalidateQueries({ queryKey: ['parcels', request._id] });
                    refetch();
                    Swal.fire({
                        title: 'Request Cancelled',
                        text: 'Your repair request has been cancelled.',
                        icon: 'success'
                    });
                })
                .catch(error => {
                    if (import.meta.env.DEV) console.error('Cancellation failed:', error);
                    Swal.fire({ icon: 'error', title: 'Could not cancel request', text: getCancellationErrorMessage(error) });
                })
                .finally(() => setCancellingId(null));
        });
    }

    // Only the request's own id is sent - the amount and customer identity
    // are always resolved server-side from trusted, stored data.
    const handlePayment = async (request) => {
        if (payingId) return;
        setPayingId(request._id);
        try {
            const res = await axiosSecure.post('/payment-checkout-session', { parcelId: request._id });
            window.location.assign(res.data.url);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Checkout session creation failed:', error);
            Swal.fire({ icon: 'error', title: 'Could not start payment', text: getPaymentErrorMessage(error) });
            setPayingId(null);
        }
    }

    const handleEditRequest = () => {
        Swal.fire({
            icon: 'info',
            title: 'Editing is not available yet',
            text: 'Changing an existing repair request isn\'t supported at the moment. Please cancel and create a new request, or contact support.'
        });
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">My Repair Requests: {requests.length}</h2>

            <div className="flex flex-col md:flex-row gap-4 my-6">
                <label className="input">
                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </g>
                    </svg>
                    <input
                        onChange={(e) => setSearchText(e.target.value)}
                        type="search"
                        className="grow"
                        placeholder="Search by device, request ID, or phone" />
                </label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
                    <option value="all">All Statuses</option>
                    {statusOptions.map((s, i) => <option key={i} value={s}>{getRepairStatusLabel(s)}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Repair Cost</th>
                            <th>Payment</th>
                            <th>Request ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredRequests.map((request, index) => {
                                const isCancelled = request.deliveryStatus === 'cancelled';
                                return <tr key={request._id}>
                                <th>{index + 1}</th>
                                <td>{request.parcelName}</td>
                                <td>{formatCurrency(request.cost)}</td>
                                <td>
                                    {
                                        request.paymentStatus === 'paid' ?
                                            <StatusBadge status="paid" />
                                            : !isCancelled &&
                                            <button
                                                onClick={() => handlePayment(request)}
                                                disabled={payingId === request._id}
                                                className="btn btn-sm btn-primary text-black">
                                                <FaCreditCard aria-hidden="true" /> {payingId === request._id ? 'Starting...' : 'Pay'}
                                            </button>

                                    }
                                </td>
                                <td>
                                    <Link to={`/track-request/${request.trackingId}`}> {request.trackingId}</Link>
                                </td>
                                <td><StatusBadge status={request.deliveryStatus || 'pending-pickup'} label={getRepairStatusLabel(request.deliveryStatus)} /></td>
                                <td>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="tooltip" data-tip="View details">
                                            <Link
                                                to={`/dashboard/my-requests/${request._id}`}
                                                aria-label="View request details"
                                                className='btn btn-square btn-sm hover:bg-primary'>
                                                <FaEye aria-hidden="true" />
                                            </Link>
                                        </div>
                                        <div className="tooltip" data-tip="Editing is not available yet">
                                            <button
                                                onClick={handleEditRequest}
                                                aria-label="Edit request (not available yet)"
                                                className='btn btn-square btn-sm hover:bg-primary'>
                                                <FiEdit aria-hidden="true" />
                                            </button>
                                        </div>
                                        {
                                            canCancelRequest(request) &&
                                            <div className="tooltip" data-tip="Cancel Request">
                                                <button
                                                    onClick={() => handleCancelRequest(request)}
                                                    disabled={cancellingId === request._id}
                                                    aria-label="Cancel Request"
                                                    className='btn btn-square btn-sm btn-outline btn-error'>
                                                    <FaBan aria-hidden="true" />
                                                </button>
                                            </div>
                                        }
                                    </div>
                                </td>
                            </tr>})
                        }

                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>You haven&apos;t created any repair requests yet.</p>
                }
                {
                    requests.length > 0 && filteredRequests.length === 0 && <p className='text-center py-8 opacity-60'>No requests match your search or filter.</p>
                }
            </div>
        </div>
    );
};

export default MyRequests;
