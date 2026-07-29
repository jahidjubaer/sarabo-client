import React from 'react';
import { Link } from 'react-router';
import { FaTools } from 'react-icons/fa';

const Banner = () => {
    return (
        <div className="hero bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl">
            <div className="hero-content text-center py-16">
                <div className="max-w-2xl">
                    <FaTools className="text-6xl text-primary mx-auto mb-6" />
                    <h1 className="text-4xl md:text-5xl font-bold">Reliable Repair Service, At Your Doorstep</h1>
                    <p className="mt-4 text-lg opacity-70">Book a verified technician for your appliances and devices, track every step, and pay securely online.</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link to="/dashboard/create-request" className="btn btn-primary">Create Repair Request</Link>
                        <Link to="/become-technician" className="btn btn-outline">Become a Technician</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;
