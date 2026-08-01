import React from 'react';
import { FaTools, FaRegCreditCard, FaTasks, FaUsers, FaUserCheck, FaUserCog, FaUser, FaClipboardList, FaBell } from 'react-icons/fa';
import { Link, NavLink, Outlet } from 'react-router';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import { SiGoogletasks } from 'react-icons/si';
import logoImg from '../assets/logo.png';
import NotificationBell from '../components/notifications/NotificationBell';

const DashboardLayout = () => {
    const { user } = useAuth();
    const { role } = useRole();
    return (
        <div className="drawer lg:drawer-open max-w-7xl mx-auto ">
            <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
                {/* Navbar */}
                <nav className="navbar w-full bg-base-300">
                    <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
                        {/* Sidebar toggle icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                    </label>
                    <div className="px-4">Sarabo Dashboard</div>
                    {/* Pushed to the far end of the bar - this bare .navbar
                    (unlike the shared NavBar) has no navbar-start/end wrapper
                    divs to lean on for spacing. Same NotificationBell used by
                    the shared NavBar, unchanged - it's already self-contained
                    (its own relative/absolute positioning), so it needs no
                    dashboard-specific variant. */}
                    <div className="ml-auto flex items-center">
                        {user && <NotificationBell />}
                    </div>
                </nav>
                {/* Page content here */}
                <div className="p-4 md:p-8">
                    <Outlet></Outlet>
                </div>

            </div>

            <div className="drawer-side is-drawer-close:overflow-visible">
                <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
                    {/* Sidebar content here */}
                    <ul className="menu w-full grow">
                        {/* List item */}
                        <li>
                            <Link to="/"><img src={logoImg} alt="" /></Link>
                        </li>
                        <li>
                            <Link to="/dashboard" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Homepage">
                                {/* Home icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                                <span className="is-drawer-close:hidden">Home page</span>
                            </Link>
                        </li>

                        {/* customer-only dashboard links - `role` is undefined
                        while useRole is loading or has errored, so these
                        correctly stay hidden until it resolves to 'user' */}
                        {
                            role === 'user' && <>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="My Repair Requests" to="/dashboard/my-requests">
                                        <FaTools />
                                        <span className="is-drawer-close:hidden">My Repair Requests</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Payment History" to="/dashboard/payment-history">
                                        <FaRegCreditCard />
                                        <span className="is-drawer-close:hidden">Payment History</span>
                                    </NavLink>
                                </li>
                            </>
                        }
                        {
                            role === 'rider' && <>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Assigned Repairs" to="/dashboard/assigned-jobs">
                                        <FaTasks />
                                        <span className="is-drawer-close:hidden">Assigned Repairs</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Completed Repairs" to="/dashboard/completed-jobs">
                                        <SiGoogletasks />
                                        <span className="is-drawer-close:hidden">Completed Repairs</span>
                                    </NavLink>
                                </li>
                            </>
                        }


                        {/* admin only links */}
                        {
                            role === 'admin' && <>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Manage Repair Requests" to="/dashboard/manage-repair-requests">
                                        <FaClipboardList />
                                        <span className="is-drawer-close:hidden">Manage Repair Requests</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Approve Technicians" to="/dashboard/approve-technicians">
                                        <FaUserCheck />
                                        <span className="is-drawer-close:hidden">Approve Technicians</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Assign Technicians" to="/dashboard/assign-technicians">
                                        <FaUserCog />
                                        <span className="is-drawer-close:hidden">Assign Technicians</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Users Management" to="/dashboard/users-management">
                                        <FaUsers></FaUsers>
                                        <span className="is-drawer-close:hidden">Users Management</span>
                                    </NavLink>
                                </li>
                            </>
                        }

                        {/* Account-level utilities, available to every
                        authenticated role - not gated by `role` like the
                        business-workflow groups above. */}
                        <li>
                            <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Notifications" to="/dashboard/notifications">
                                <FaBell />
                                <span className="is-drawer-close:hidden">Notifications</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Profile" to="/dashboard/profile">
                                <FaUser />
                                <span className="is-drawer-close:hidden">Profile</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;