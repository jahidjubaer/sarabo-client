import { useQuery } from '@tanstack/react-query';
import React from 'react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';
import { FaCheck, FaBan, FaRoute, FaClipboardCheck } from 'react-icons/fa';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';

const AssignedJobs = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

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

    const handleJobStatusUpdate = (request, status) => {
        const statusInfo = {
            deliveryStatus: status,
            riderId: request.riderId,
            trackingId: request.trackingId
        }

        let message = `Job status is updated with ${status.split('_').join(' ')}`

        axiosSecure.patch(`/parcels/${request._id}/status`, statusInfo)
            .then(res => {
                if (res.data.modifiedCount) {
                    refetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: message,
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            })
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Jobs Pending Visit: {requests.length}</h2>

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
                                                className='btn btn-primary text-black btn-sm'>
                                                <FaCheck aria-hidden="true" /> Accept
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
                                        : <StatusBadge status={request.deliveryStatus} />
                                }

                            </td>
                            <td>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleJobStatusUpdate(request, 'parcel_picked_up')}
                                        className='btn btn-primary text-black btn-sm'>
                                        <FaRoute aria-hidden="true" /> Start Visit
                                    </button>
                                    <button
                                        onClick={() => handleJobStatusUpdate(request, 'parcel_delivered')}
                                        className='btn btn-primary text-black btn-sm'>
                                        <FaClipboardCheck aria-hidden="true" /> Mark as Completed
                                    </button>
                                </div>
                            </td>
                        </tr>)}


                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>You have no assigned repair jobs at the moment.</p>
                }
            </div>

        </div >
    );
};

export default AssignedJobs;
