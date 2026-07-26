import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading/Loading';

const AssignTechnicians = () => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchText, setSearchText] = useState('');
    const axiosSecure = useAxiosSecure();
    const technicianModalRef = useRef();

    const { data: requests = [], refetch: requestsRefetch, isLoading } = useQuery({
        queryKey: ['requests', 'pending-assignment'],
        queryFn: async () => {
            const res = await axiosSecure.get('/parcels?deliveryStatus=pending-pickup')
            return res.data;
        }
    })

    // todo: invalidate query after assigning a technician
    const { data: technicians = [], refetch: techniciansRefetch } = useQuery({
        queryKey: ['technicians', selectedRequest?.senderDistrict, 'available'],
        enabled: !!selectedRequest,
        queryFn: async () => {
            const res = await axiosSecure.get(`/riders?status=approved&district=${selectedRequest?.senderDistrict}&workStatus=available`);
            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    const filteredRequests = requests.filter(r => !searchText ||
        (r.parcelName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.senderDistrict || '').toLowerCase().includes(searchText.toLowerCase()));

    const openAssignTechnicianModal = request => {
        setSelectedRequest(request);

        technicianModalRef.current.showModal()
    }

    const handleAssignTechnician = technician => {
        const technicianAssignInfo = {
            riderId: technician._id,
            riderEmail: technician.email,
            riderName: technician.name,
            parcelId: selectedRequest._id,
            trackingId: selectedRequest.trackingId
        }
        axiosSecure.patch(`/parcels/${selectedRequest._id}`, technicianAssignInfo)
            .then(res => {
                if (res.data.modifiedCount) {
                    technicianModalRef.current.close();
                    requestsRefetch();
                    techniciansRefetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: `Technician has been assigned.`,
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            })
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Assign Technicians: {requests.length}</h2>

            <label className="input my-6">
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
                    placeholder="Search by device or district" />
            </label>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Cost</th>
                            <th>Created At</th>
                            <th>Visit District</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((request, index) => <tr key={request._id}>
                            <th>{index + 1}</th>
                            <td>{request.parcelName}</td>
                            <td>{request.cost}</td>
                            <td>{request.createdAt}</td>
                            <td>{request.senderDistrict}</td>
                            <td>
                                <button
                                    onClick={() => openAssignTechnicianModal(request)}
                                    className='btn btn-primary text-black'>Find Technicians</button>
                            </td>
                        </tr>)}

                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>No repair requests are waiting for technician assignment right now.</p>
                }
                {
                    requests.length > 0 && filteredRequests.length === 0 && <p className='text-center py-8 opacity-60'>No requests match your search.</p>
                }
            </div>
            <dialog ref={technicianModalRef} className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Technicians: {technicians.length}</h3>

                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            {/* head */}
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {technicians.map((technician, i) => <tr key={technician._id}>
                                    <th>{i + 1}</th>
                                    <td>{technician.name}</td>
                                    <td>{technician.email}</td>
                                    <td>
                                        <button
                                            onClick={() => handleAssignTechnician(technician)}
                                            className='btn btn-primary text-black'>Assign</button>
                                    </td>
                                </tr>)}


                            </tbody>
                        </table>
                        {
                            technicians.length === 0 && <p className='text-center py-8 opacity-60'>No available technicians found for this service area.</p>
                        }
                    </div>

                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default AssignTechnicians;
