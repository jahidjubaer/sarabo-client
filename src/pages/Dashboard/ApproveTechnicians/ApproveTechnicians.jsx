import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { FaEye, FaUserCheck } from 'react-icons/fa';
import { IoPersonRemoveSharp } from 'react-icons/io5';
import { FaTrashCan } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { humanizeStatus } from '../../../utils/statusBadge';

// Technician work-status wording is display-only here - the stored
// workStatus values ('available'/'in_delivery') are unchanged and still
// used for querying (see AssignTechnicians.jsx's workStatus=available
// filter); 'in_delivery' predates the repair-service rename and must never
// be shown to an admin as-is.
const WORK_STATUS_LABELS = { available: 'Available', in_delivery: 'On a Repair' };
const getWorkStatusLabel = status => WORK_STATUS_LABELS[status] || humanizeStatus(status);

const ApproveTechnicians = () => {
    const axiosSecure = useAxiosSecure();
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    const { refetch, data: technicians = [], isLoading } = useQuery({
        queryKey: ['technicians', 'pending'],
        queryFn: async () => {
            const res = await axiosSecure.get('/riders');
            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    const statusOptions = [...new Set(technicians.map(t => t.status).filter(Boolean))];

    const filteredTechnicians = technicians.filter(t => {
        const matchesSearch = !searchText ||
            (t.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (t.email || '').toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const updateTechnicianStatus = (technician, status) => {
        const updateInfo = { status: status, email: technician.email }
        axiosSecure.patch(`/riders/${technician._id}`, updateInfo)
            .then(res => {
                if (res.data.modifiedCount) {
                    refetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: `Technician status is set to ${status}.`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            })
    }

    const handleApproval = technician => {
        updateTechnicianStatus(technician, 'approved');
    }

    const handleRejection = technician => {
        updateTechnicianStatus(technician, 'rejected')
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Technicians Pending Approval: {technicians.length}</h2>

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
                        placeholder="Search by name or email" />
                </label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
                    <option value="all">All Statuses</option>
                    {statusOptions.map((s, i) => <option key={i} value={s}>{humanizeStatus(s)}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>District</th>
                            <th>Application Status</th>
                            <th>Work Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredTechnicians.map((technician, index) => <tr key={technician._id}>
                                <th>{index + 1}</th>
                                <td>{technician.name}</td>
                                <td>{technician.email}</td>
                                <td>{technician.district}</td>
                                <td>
                                    <StatusBadge status={technician.status} />
                                </td>
                                <td><StatusBadge status={technician.workStatus} label={getWorkStatusLabel(technician.workStatus)} /></td>
                                <td>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="tooltip" data-tip="View details">
                                            <button
                                                onClick={() => setSelectedTechnician(technician)}
                                                aria-label="View technician details"
                                                className='btn btn-sm'>
                                                <FaEye aria-hidden="true" />
                                            </button>
                                        </div>
                                        {
                                            technician.status !== 'approved' &&
                                            <div className="tooltip" data-tip="Approve technician">
                                                <button
                                                    onClick={() => handleApproval(technician)}
                                                    aria-label="Approve technician"
                                                    className='btn btn-success text-black btn-sm'>
                                                    <FaUserCheck aria-hidden="true" />
                                                </button>
                                            </div>
                                        }
                                        {
                                            technician.status !== 'rejected' &&
                                            <div className="tooltip" data-tip="Reject technician">
                                                <button
                                                    onClick={() => handleRejection(technician)}
                                                    aria-label="Reject technician"
                                                    className='btn btn-error text-black btn-sm'>
                                                    <IoPersonRemoveSharp aria-hidden="true" />
                                                </button>
                                            </div>
                                        }
                                        <div className="tooltip" data-tip="Deleting technicians is not available yet">
                                            <button
                                                type="button"
                                                disabled
                                                aria-disabled="true"
                                                aria-label="Delete technician (not available yet)"
                                                className='btn btn-error text-black btn-sm'>
                                                <FaTrashCan aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>)
                        }


                    </tbody>
                </table>
                {
                    technicians.length === 0 && <p className='text-center py-8 opacity-60'>No technician applications are pending approval.</p>
                }
                {
                    technicians.length > 0 && filteredTechnicians.length === 0 && <p className='text-center py-8 opacity-60'>No technicians match your search or filter.</p>
                }
            </div>

            {
                selectedTechnician && (
                    <dialog open className="modal modal-bottom sm:modal-middle">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">{selectedTechnician.name}</h3>
                            <div className="mt-4 space-y-1">
                                <p><span className="font-semibold">Email:</span> {selectedTechnician.email}</p>
                                <p><span className="font-semibold">Region:</span> {selectedTechnician.region}</p>
                                <p><span className="font-semibold">District:</span> {selectedTechnician.district}</p>
                                <p><span className="font-semibold">Address:</span> {selectedTechnician.address}</p>
                                <p><span className="font-semibold">Skills / Specialization:</span> {selectedTechnician.license}</p>
                                <p><span className="font-semibold">National ID:</span> {selectedTechnician.nid}</p>
                                <p><span className="font-semibold">Experience:</span> {selectedTechnician.bike}</p>
                                <p><span className="font-semibold">Application Status:</span> <StatusBadge status={selectedTechnician.status} /></p>
                                <p><span className="font-semibold">Work Status:</span> <StatusBadge status={selectedTechnician.workStatus} label={getWorkStatusLabel(selectedTechnician.workStatus)} /></p>
                            </div>
                            <div className="modal-action">
                                <button onClick={() => setSelectedTechnician(null)} className="btn">Close</button>
                            </div>
                        </div>
                        <form method="dialog" className="modal-backdrop">
                            <button onClick={() => setSelectedTechnician(null)}>close</button>
                        </form>
                    </dialog>
                )
            }
        </div>
    );
};

export default ApproveTechnicians;
