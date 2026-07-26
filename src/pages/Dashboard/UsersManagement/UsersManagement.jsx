import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { FaUserShield } from 'react-icons/fa';
import { FiShieldOff } from 'react-icons/fi';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading/Loading';

const roleLabels = { user: 'Customer', rider: 'Technician', admin: 'Admin' };

const UsersManagement = () => {
    const axiosSecure = useAxiosSecure();
    const [searchText, setSearchText] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')

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

    const handleMakeAdmin = user => {
        const roleInfo = { role: 'admin' }
        //TODO: must ask for confirmation before proceed
        axiosSecure.patch(`/users/${user._id}/role`, roleInfo)
            .then(res => {
                console.log(res.data);
                if (res.data.modifiedCount) {
                    refetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: `${user.displayName} marked as an Admin`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            })
    }

    const handleRemoveAdmin = user => {
        const roleInfo = { role: 'user' }
        //TODO: must ask for confirmation before proceed
        axiosSecure.patch(`/users/${user._id}/role`, roleInfo)
            .then(res => {
                if (res.data.modifiedCount) {
                    refetch();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: `${user.displayName} removed from Admin`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            })
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
                                        className='btn btn-error text-black'>
                                        <FiShieldOff />
                                    </button> :
                                    <button
                                        onClick={() => handleMakeAdmin(user)}
                                        className='btn btn-success text-black'>
                                        <FaUserShield></FaUserShield>
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