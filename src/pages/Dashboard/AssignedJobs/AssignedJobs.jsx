import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';
import { FaCheck, FaBan, FaRoute, FaClipboardCheck } from 'react-icons/fa';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { getRepairStatusActionErrorMessage } from '../../../utils/repairStatusActionErrorMessage';

const PENDING_LABELS = {
    rider_arriving: 'Starting Journey...',
    parcel_picked_up: 'Starting Repair...',
    parcel_delivered: 'Completing Repair...'
};

const AssignedJobs = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    // Tracks which request + which action is in flight, so only that
    // request's buttons disable/relabel - not the whole table.
    const [pendingAction, setPendingAction] = useState(null);

    const { data: requests = [], refetch, isLoading } = useQuery({
        queryKey: ['assignedJobs', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/rider?riderEmail=${user.email}&deliveryStatus=driver_assigned`)

            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    // Only { deliveryStatus } is sent - the server always derives the
    // assigned technician and trackingId from the repair request document
    // itself, never from this body (see parcelController.updateParcelStatus
    // / completeParcel).
    const handleJobStatusUpdate = (request, status) => {
        if (pendingAction) return;
        setPendingAction({ id: request._id, status });

        const message = `Repair status updated: ${getRepairStatusLabel(status)}`;

        axiosSecure.patch(`/parcels/${request._id}/status`, { deliveryStatus: status })
            .then(() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['completedJobs', user?.email] });
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: message,
                    showConfirmButton: false,
                    timer: 1500
                });
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('Repair status update failed:', error);
                Swal.fire({ icon: 'error', title: 'Could not update repair request', text: getRepairStatusActionErrorMessage(error) });
                // A conflict (e.g. already updated concurrently) means the
                // list shown may be stale - refresh so the technician sees
                // the current state.
                refetch();
            })
            .finally(() => setPendingAction(null));
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Assigned Repairs: {requests.length}</h2>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Confirm</th>
                            <th>Other Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, i) => <tr key={request._id}>
                            <th>{i + 1}</th>
                            <td>{request.parcelName}</td>
                            <td>
                                {
                                    request.deliveryStatus === 'driver_assigned'
                                        ? <div className="flex flex-wrap gap-2 items-center">
                                            <button
                                                onClick={() => handleJobStatusUpdate(request, 'rider_arriving')}
                                                disabled={pendingAction?.id === request._id}
                                                className='btn btn-primary btn-sm'>
                                                <FaCheck aria-hidden="true" />
                                                {pendingAction?.id === request._id && pendingAction.status === 'rider_arriving'
                                                    ? PENDING_LABELS.rider_arriving
                                                    : ' Start Journey'}
                                            </button>
                                            <div className="tooltip" data-tip="Rejecting jobs is not available yet">
                                                <button
                                                    type="button"
                                                    disabled
                                                    aria-disabled="true"
                                                    className='btn btn-error text-black btn-sm'>
                                                    <FaBan aria-hidden="true" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                        : <StatusBadge status={request.deliveryStatus} label={getRepairStatusLabel(request.deliveryStatus)} />
                                }

                            </td>
                            <td>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleJobStatusUpdate(request, 'parcel_picked_up')}
                                        disabled={pendingAction?.id === request._id}
                                        className='btn btn-primary btn-sm'>
                                        <FaRoute aria-hidden="true" />
                                        {pendingAction?.id === request._id && pendingAction.status === 'parcel_picked_up'
                                            ? PENDING_LABELS.parcel_picked_up
                                            : ' Start Repair'}
                                    </button>
                                    <button
                                        onClick={() => handleJobStatusUpdate(request, 'parcel_delivered')}
                                        disabled={pendingAction?.id === request._id}
                                        className='btn btn-primary btn-sm'>
                                        <FaClipboardCheck aria-hidden="true" />
                                        {pendingAction?.id === request._id && pendingAction.status === 'parcel_delivered'
                                            ? PENDING_LABELS.parcel_delivered
                                            : ' Complete Repair'}
                                    </button>
                                </div>
                            </td>
                        </tr>)}


                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>You have no assigned repairs at the moment.</p>
                }
            </div>

        </div >
    );
};

export default AssignedJobs;
