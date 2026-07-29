import React from 'react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useQuery } from '@tanstack/react-query';
import { FaMoneyBillWave } from 'react-icons/fa';
import Loading from '../../../components/Loading/Loading';
import { formatCurrency } from '../../../utils/formatCurrency';

const CompletedJobs = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['completedJobs', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/rider?riderEmail=${user.email}&deliveryStatus=parcel_delivered`)

            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    const calculatePayout = request => {
        if (request.senderDistrict === request.receiverDistrict) {
            return request.cost * 0.8
        }
        else{
            return request.cost * 0.6;
        }
    }

    return (
        <div>
            <h2 className='text-4xl font-bold'>Completed Repairs: {requests.length}</h2>
            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Created At</th>
                            <th>Visit District</th>
                            <th>Repair Cost</th>
                            <th>Payout</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => <tr key={request._id}>
                            <th>{index + 1}</th>
                            <td>{request.parcelName}</td>
                            <td>{request.createdAt}</td>
                            <td>{request.senderDistrict}</td>
                            <td>{formatCurrency(request.cost)}</td>
                            <td>{formatCurrency(calculatePayout(request))}</td>
                            <td>
                                <div className="tooltip" data-tip="Payout processing is not available yet">
                                    <button
                                        type="button"
                                        disabled
                                        aria-disabled="true"
                                        className='btn btn-primary btn-sm'>
                                        <FaMoneyBillWave aria-hidden="true" /> Cash out
                                    </button>
                                </div>
                            </td>
                        </tr>)}

                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>No completed repairs yet.</p>
                }
            </div>
        </div>
    );
};

export default CompletedJobs;
