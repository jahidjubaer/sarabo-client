import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { FaUserShield } from 'react-icons/fa';
import { FiShieldOff } from 'react-icons/fi';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading/Loading';
import { getUserRoleUpdateErrorMessage } from '../../../utils/userRoleUpdateErrorMessage';

const roleLabels = { user: 'Customer', rider: 'Technician', admin: 'Admin' };

const UsersManagement = () => {
    const axiosSecure = useAxiosSecure();
    const [searchText, setSearchText] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    // Tracks which user row has a role update in flight, so only that row's
    // button disables/relabels - not the whole table.
    const [pendingUserId, setPendingUserId] = useState(null);

    const { refetch, data: users = [], isLoading } = useQuery({
        queryKey: ['users', searchText],
        queryFn: async () => {
            const res = await axiosSecure.get(`/users?searchText=${searchText}`);
            return res.data;
        }
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    const filteredUsers = users.filter(u => roleFilter === 'all' || u.role === roleFilter);

    const updateUserRole = (user, role, successMessage) => {
        if (pendingUserId) return;
        setPendingUserId(user._id);

        axiosSecure.patch(`/users/${user._id}/role`, { role })
            .then(res => {
                if (res.data.modifiedCount) {
                    refetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: successMessage,
                        showConfirmButton: false,
                        timer: 2000
                    });
                } else {
                    // No document was modified but no error was thrown either -
                    // the list shown may be stale (e.g. the role already
                    // changed, or this user no longer exists). Refresh rather
                    // than silently doing nothing.
                    refetch();
                    Swal.fire({
                        icon: 'info',
                        title: 'No change was made',
                        text: "This user's role may have already been updated. The list has been refreshed."
                    });
                }
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('User role update failed:', error);
                Swal.fire({ icon: 'error', title: 'Could not update user role', text: getUserRoleUpdateErrorMessage(error) });
                refetch();
            })
            .finally(() => setPendingUserId(null));
    }

    //TODO: must ask for confirmation before proceed
    const handleMakeAdmin = user => {
        updateUserRole(user, 'admin', `${user.displayName} marked as an Admin`);
    }

    //TODO: must ask for confirmation before proceed
    const handleRemoveAdmin = user => {
        updateUserRole(user, 'user', `${user.displayName} removed from Admin`);
    }

    return (
        <div>
            <h2 className='text-4xl font-bold'>Manage Users: {users.length}</h2>
            <div className="flex flex-col md:flex-row gap-4 my-6">
                <label className="input">
                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth="2.5"
                            fill="none"
                            stroke="currentColor"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </g>
                    </svg>
                    <input
                        onChange={(e) => setSearchText(e.target.value)}
                        type="search"
                        className="grow"
                        placeholder="Search users" />

                </label>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select">
                    <option value="all">All Roles</option>
                    <option value="user">Customer</option>
                    <option value="rider">Technician</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th>
                                #
                            </th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Admin Action</th>
                            <th>Others Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, index) => <tr key={user._id}>
                            <td>
                                {index + 1}
                            </td>
                            <td>
                                <div className="flex items-center gap-3">
                                    <div className="avatar">
                                        <div className="mask mask-squircle h-12 w-12">
                                            <img
                                                src={user.photoURL}
                                                alt="Avatar Tailwind CSS Component" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">{user.displayName}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {user.email}
                            </td>
                            <td>
                                {roleLabels[user.role] || user.role}
                            </td>
                            <td>
                                {user.role === 'admin' ?
                                    <button
                                        onClick={() => handleRemoveAdmin(user)}
                                        disabled={pendingUserId === user._id}
                                        className='btn btn-error text-black'>
                                        {pendingUserId === user._id ? 'Updating...' : <FiShieldOff />}
                                    </button> :
                                    <button
                                        onClick={() => handleMakeAdmin(user)}
                                        disabled={pendingUserId === user._id}
                                        className='btn btn-success text-black'>
                                        {pendingUserId === user._id ? 'Updating...' : <FaUserShield></FaUserShield>}
                                    </button>
                                }
                            </td>
                            <th>
                                Actions
                            </th>
                        </tr>)}



                    </tbody>
                </table>
                {
                    users.length === 0 && <p className='text-center py-8 opacity-60'>No users match your search.</p>
                }
                {
                    users.length > 0 && filteredUsers.length === 0 && <p className='text-center py-8 opacity-60'>No users match the selected role.</p>
                }
            </div>
        </div>
    );
};

export default UsersManagement;