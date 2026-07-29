import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading/Loading';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getAssignmentErrorMessage } from '../../../utils/assignmentErrorMessage';

const AssignTechnicians = () => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [assigningId, setAssigningId] = useState(null);
    const axiosSecure = useAxiosSecure();
    const technicianModalRef = useRef();
    const [searchParams, setSearchParams] = useSearchParams();
    // Supports being deep-linked from the Manage Repair Requests page with a
    // specific request preselected (?request=<id>) - only ever auto-opens
    // once per arrival at this page, and only for a request that is actually
    // still in this pending-assignment list (never trusts the id alone).
    const preselectRequestId = searchParams.get('request');
    const [autoOpenedFor, setAutoOpenedFor] = useState(null);

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

    const openAssignTechnicianModal = request => {
        setSelectedRequest(request);

        technicianModalRef.current.showModal()
    }

    useEffect(() => {
        if (isLoading || !preselectRequestId || autoOpenedFor === preselectRequestId) return;

        const match = requests.find(r => r._id === preselectRequestId);
        if (match) {
            openAssignTechnicianModal(match);
        }
        // Whether found or not, this preselect id has now been handled once -
        // never keep retrying it (e.g. after the modal is closed) or fall
        // back to a silent no-op forever if it wasn't eligible/found.
        setAutoOpenedFor(preselectRequestId);
        // Drop the query param so a later manual refetch/reopen doesn't
        // re-trigger the same preselection.
        setSearchParams(params => {
            params.delete('request');
            return params;
        }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, requests, preselectRequestId, autoOpenedFor]);

    if (isLoading) {
        return <Loading></Loading>
    }

    const filteredRequests = requests.filter(r => !searchText ||
        (r.parcelName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.senderDistrict || '').toLowerCase().includes(searchText.toLowerCase()));

    // Only riderId is required server-side (the technician's name/email are
    // looked up and trusted from the database, not from this body) - the
    // extra fields are harmless and kept for backward compatibility with
    // any other consumer of this same request shape.
    const handleAssignTechnician = technician => {
        if (assigningId) return;
        setAssigningId(technician._id);

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
            .catch(error => {
                if (import.meta.env.DEV) console.error('Technician assignment failed:', error);
                Swal.fire({ icon: 'error', title: 'Could not assign technician', text: getAssignmentErrorMessage(error) });
                // A conflict (already assigned/cancelled) means the lists
                // shown are stale - refresh so the admin sees current state.
                requestsRefetch();
                techniciansRefetch();
            })
            .finally(() => setAssigningId(null));
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
                            <th>Repair Cost</th>
                            <th>Created At</th>
                            <th>Visit District</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((request, index) => <tr key={request._id}>
                            <th>{index + 1}</th>
                            <td>{request.parcelName}</td>
                            <td>{formatCurrency(request.cost)}</td>
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
                                            disabled={!!assigningId}
                                            className='btn btn-primary text-black'>{assigningId === technician._id ? 'Assigning...' : 'Assign'}</button>
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
