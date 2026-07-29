import { useQuery, keepPreviousData } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FaEye, FaUserCog } from 'react-icons/fa';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { getManageRepairRequestsErrorMessage } from '../../../utils/manageRepairRequestsErrorMessage';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending-pickup', label: 'Request Submitted' },
    { value: 'driver_assigned', label: 'Technician Assigned' },
    { value: 'rider_arriving', label: 'Technician On The Way' },
    { value: 'parcel_picked_up', label: 'Repair In Progress' },
    { value: 'parcel_delivered', label: 'Repair Completed' },
    { value: 'cancelled', label: 'Request Cancelled' },
];

const PAYMENT_OPTIONS = [
    { value: 'all', label: 'All Payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
];

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 10;

const ManageRepairRequests = () => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [page, setPage] = useState(1);

    // Modest debounce so filtering/searching doesn't fire a request on every
    // keystroke - resets back to page 1 once the debounced term actually
    // changes, not on every keystroke.
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const queryKey = ['adminRepairRequests', { page, search: debouncedSearch, status, paymentStatus }];

    const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            const params = { page, limit: PAGE_LIMIT };
            if (debouncedSearch) params.search = debouncedSearch;
            if (status !== 'all') params.status = status;
            if (paymentStatus !== 'all') params.paymentStatus = paymentStatus;

            const res = await axiosSecure.get('/admin/parcels', { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
        retry: 1,
    });

    const handleStatusChange = value => {
        setStatus(value);
        setPage(1);
    };

    const handlePaymentChange = value => {
        setPaymentStatus(value);
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setStatus('all');
        setPaymentStatus('all');
        setPage(1);
    };

    const hasActiveFilters = !!debouncedSearch || status !== 'all' || paymentStatus !== 'all';

    if (isLoading) {
        return <Loading></Loading>
    }

    if (isError) {
        return (
            <div>
                <h2 className="text-4xl font-bold">Manage Repair Requests</h2>
                <div className="alert alert-error mt-8">
                    <span>{getManageRepairRequestsErrorMessage(error)}</span>
                </div>
                <button onClick={() => refetch()} className="btn btn-primary text-black mt-4">Retry</button>
            </div>
        );
    }

    const requests = data?.data ?? [];
    const pagination = data?.pagination ?? { page: 1, limit: PAGE_LIMIT, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false };

    return (
        <div>
            <h2 className="text-4xl font-bold">Manage Repair Requests</h2>
            <p className="opacity-70 mt-2">
                Complete operational view of every repair request - pending, assigned, in-progress, completed, cancelled, paid, and unpaid.
            </p>
            <p className="mt-2 font-semibold">Total requests: {pagination.totalItems}</p>

            <div className="flex flex-col md:flex-row gap-4 my-6">
                <label className="input" htmlFor="manage-requests-search">
                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </g>
                    </svg>
                    <input
                        id="manage-requests-search"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        type="search"
                        className="grow"
                        aria-label="Search repair requests by tracking code, customer name, email, or device"
                        placeholder="Search by tracking code, customer, or device" />
                </label>

                <label className="sr-only" htmlFor="manage-requests-status">Filter by repair status</label>
                <select
                    id="manage-requests-status"
                    value={status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="select">
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>

                <label className="sr-only" htmlFor="manage-requests-payment">Filter by payment status</label>
                <select
                    id="manage-requests-payment"
                    value={paymentStatus}
                    onChange={e => handlePaymentChange(e.target.value)}
                    className="select">
                    {PAYMENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>

                {hasActiveFilters && (
                    <button onClick={handleResetFilters} className="btn btn-outline">Reset Filters</button>
                )}
            </div>

            {isFetching && <p className="opacity-60 text-sm mb-2" role="status">Updating results...</p>}

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Tracking Code</th>
                            <th>Customer</th>
                            <th>Device</th>
                            <th>Repair Status</th>
                            <th>Payment</th>
                            <th>Cost</th>
                            <th>Technician</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={request._id}>
                                <th>{(pagination.page - 1) * pagination.limit + index + 1}</th>
                                <td>{request.trackingId}</td>
                                <td>
                                    <div>{request.senderName}</div>
                                    <div className="opacity-60 text-sm break-all">{request.senderEmail}</div>
                                </td>
                                <td>{request.parcelName}</td>
                                <td><StatusBadge status={request.deliveryStatus || 'pending-pickup'} label={getRepairStatusLabel(request.deliveryStatus)} /></td>
                                <td><StatusBadge status={request.paymentStatus === 'paid' ? 'paid' : 'unpaid'} /></td>
                                <td>{formatCurrency(request.cost)}</td>
                                <td>{request.riderName || 'Unassigned'}</td>
                                <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}</td>
                                <td>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="tooltip" data-tip="View details">
                                            <Link
                                                to={`/dashboard/manage-repair-requests/${request._id}`}
                                                aria-label={`View details for request ${request.trackingId}`}
                                                className="btn btn-square btn-sm hover:bg-primary">
                                                <FaEye aria-hidden="true" />
                                            </Link>
                                        </div>
                                        {request.canAssign && (
                                            <div className="tooltip" data-tip="Assign Technician">
                                                <button
                                                    onClick={() => navigate(`/dashboard/assign-technicians?request=${request._id}`)}
                                                    aria-label={`Assign technician for request ${request.trackingId}`}
                                                    className="btn btn-square btn-sm hover:bg-primary">
                                                    <FaUserCog aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {
                    requests.length === 0 && !hasActiveFilters &&
                    <p className="text-center py-8 opacity-60">No repair requests exist yet.</p>
                }
                {
                    requests.length === 0 && hasActiveFilters &&
                    <p className="text-center py-8 opacity-60">No requests match your search or filters.</p>
                }
            </div>

            {pagination.totalPages > 1 && (
                <div className="join mt-6 flex justify-center">
                    <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={!pagination.hasPreviousPage}
                        aria-label="Previous page"
                        className="join-item btn">
                        Previous
                    </button>
                    <span className="join-item btn btn-disabled">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!pagination.hasNextPage}
                        aria-label="Next page"
                        className="join-item btn">
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageRepairRequests;
