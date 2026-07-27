import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router';
import { FaHistory, FaCreditCard, FaArrowLeft, FaBan } from 'react-icons/fa';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { humanizeStatus } from '../../../utils/statusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { canCancelRequest } from '../../../utils/cancellationEligibility';

const RequestDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [cancelling, setCancelling] = useState(false);

    const { data: request, isLoading, isError, refetch } = useQuery({
        queryKey: ['parcels', id],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/${id}`);
            return res.data;
        },
        retry: false
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    if (isError || !request) {
        return (
            <div>
                <h2 className="text-4xl font-bold">Repair request not found</h2>
                <p className="mt-4 opacity-70">This request may have been removed, or you may not have access to it.</p>
                <Link to="/dashboard/my-requests" className="btn btn-outline mt-6">
                    <FaArrowLeft aria-hidden="true" /> Back to My Repair Requests
                </Link>
            </div>
        );
    }

    const isCancelled = request.deliveryStatus === 'cancelled';

    const handleCancelRequest = () => {
        if (cancelling) return;

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

            setCancelling(true);
            axiosSecure.patch(`/parcels/${id}/cancel`)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['parcels', id] });
                    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
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
                .finally(() => setCancelling(false));
        });
    };

    return (
        <div>
            <h2 className="text-4xl font-bold">Repair Request Details</h2>
            <p className="opacity-70 mt-2">Request ID: {request.trackingId}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Device</h3>
                    <p><span className="font-semibold">Device Name:</span> {request.parcelName}</p>
                    {request.parcelWeight && <p><span className="font-semibold">Weight:</span> {request.parcelWeight} kg</p>}
                    {request.receiverEmail && <p><span className="font-semibold">Brand / Model:</span> {request.receiverEmail}</p>}
                    {request.receiverRegion && <p><span className="font-semibold">Category:</span> {request.receiverRegion}</p>}
                    {request.priority && <p><span className="font-semibold">Priority:</span> {humanizeStatus(request.priority)}</p>}
                    {request.receiverAddress && <p className="mt-2"><span className="font-semibold">Problem:</span> {request.receiverAddress}</p>}
                </div>

                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Customer & Service Address</h3>
                    <p><span className="font-semibold">Name:</span> {request.senderName}</p>
                    <p><span className="font-semibold">Email:</span> {request.senderEmail}</p>
                    {request.senderPhone && <p><span className="font-semibold">Phone:</span> {request.senderPhone}</p>}
                    <p><span className="font-semibold">Address:</span> {request.senderAddress}, {request.senderDistrict}, {request.senderRegion}</p>
                    {request.visitInstructions && <p className="mt-2"><span className="font-semibold">Visit Instructions:</span> {request.visitInstructions}</p>}
                </div>

                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Status & Payment</h3>
                    <p><span className="font-semibold">Repair Status:</span> <StatusBadge status={request.deliveryStatus || 'pending-pickup'} label={getRepairStatusLabel(request.deliveryStatus)} /></p>
                    <p><span className="font-semibold">Repair Cost:</span> {formatCurrency(request.cost)}</p>
                    <p><span className="font-semibold">Payment:</span> <StatusBadge status={request.paymentStatus || 'unpaid'} /></p>
                    {request.riderName && <p><span className="font-semibold">Assigned Technician:</span> {request.riderName}</p>}
                </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/track-request/${request.trackingId}`} className="btn btn-primary text-black">
                    <FaHistory aria-hidden="true" /> View Timeline
                </Link>
                {request.paymentStatus !== 'paid' && !isCancelled && (
                    <Link to={`/dashboard/payment/${request._id}`} className="btn btn-primary text-black">
                        <FaCreditCard aria-hidden="true" /> Pay Now
                    </Link>
                )}
                {canCancelRequest(request) && (
                    <button
                        onClick={handleCancelRequest}
                        disabled={cancelling}
                        className="btn btn-outline btn-error">
                        <FaBan aria-hidden="true" /> {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                )}
                <Link to="/dashboard/my-requests" className="btn btn-outline">
                    <FaArrowLeft aria-hidden="true" /> Back to My Repair Requests
                </Link>
            </div>
        </div>
    );
};

export default RequestDetails;
