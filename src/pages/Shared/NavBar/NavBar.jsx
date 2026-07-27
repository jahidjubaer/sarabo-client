import React from 'react';
import Logo from '../../../components/Logo/Logo';
import { Link, NavLink } from 'react-router';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';

const NavBar = () => {

    const { user, logOut } = useAuth();
    const { role } = useRole();

    const handleLogOut = () => {
        logOut()
            .then()
            .catch(error => {
                console.log(error)
            })
    }

    const links = <>
        <li><NavLink to="/services">Services</NavLink></li>
        {/* Public before login (preserves existing anonymous behavior); once
        signed in, customer-only - `role` is undefined for anonymous visitors,
        while useRole is loading, and on a role-fetch error, so this never
        flashes for admin/technician or briefly shows before it should. */}
        {
            (!user || role === 'user') &&
            <li><NavLink to="/dashboard/create-request">Create Repair Request</NavLink></li>
        }
        <li><NavLink to="/service-areas">Service Areas</NavLink></li>
        {
            user && <>
                {
                    role === 'user' && <li><NavLink to="/dashboard/my-requests">My Repair Requests</NavLink></li>
                }
                <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            </>
        }
        <li><NavLink to="/about">About Us</NavLink></li>
    </>
    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex="-1"
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        {links}
                        <li><NavLink to="/become-technician">Become a Technician</NavLink></li>
                    </ul>
                </div>
                <span className="btn btn-ghost text-xl">
                    <Logo></Logo>
                </span>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    {links}
                </ul>
            </div>
            <div className="navbar-end gap-2">
                {
                    user ?
                        <a onClick={handleLogOut} className="btn">Log Out</a>
                        : <Link className='btn' to="/login">Log in</Link>
                }
                <Link
                    className='btn btn-primary text-black hidden lg:inline-flex'
                    to="/become-technician">Become a Technician</Link>
            </div>
        </div>
    );
};

export default NavBar;