import React from 'react';
import Logo from '../components/Logo/Logo';
import { Outlet } from 'react-router';
import { FaTools } from 'react-icons/fa';

const AuthLayout = () => {
    return (
        <div className='max-w-7xl mx-auto p-4'>
            <Logo></Logo>
            <div className='flex items-center min-h-[70vh]'>
                <div className='flex-1'>
                    <Outlet></Outlet>
                </div>
                <div className='hidden md:flex flex-1 justify-center'>
                    <div className="hero bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl w-full py-16">
                        <div className="hero-content text-center">
                            <div className="max-w-sm">
                                <FaTools className="text-7xl text-primary mx-auto mb-6" />
                                <h2 className="text-2xl font-bold">Trusted Repair Service</h2>
                                <p className="mt-2 opacity-70">Verified technicians, transparent pricing, and secure online payment — all in one place.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
