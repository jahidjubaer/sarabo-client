import React from 'react';
import { Link } from 'react-router';
import { FaTools, FaMapMarkerAlt, FaUserCheck } from 'react-icons/fa';

const About = () => {
    return (
        <div className="px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl font-bold">About Sarabo</h2>
                <p className="mt-4 opacity-70">
                    Sarabo is a doorstep repair-service platform that connects customers
                    with verified technicians for home appliances and electronics. Instead
                    of carrying a broken device around town, you request a repair and a
                    technician comes to you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body items-center text-center">
                        <FaTools className="text-3xl text-primary" />
                        <h3 className="card-title mt-2">Wide Range of Repairs</h3>
                        <p className="text-sm opacity-70">
                            ACs, refrigerators, washing machines, TVs, mobiles, laptops and more.
                        </p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body items-center text-center">
                        <FaUserCheck className="text-3xl text-primary" />
                        <h3 className="card-title mt-2">Verified Technicians</h3>
                        <p className="text-sm opacity-70">
                            Every technician is approved before being assigned to a repair request.
                        </p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body items-center text-center">
                        <FaMapMarkerAlt className="text-3xl text-primary" />
                        <h3 className="card-title mt-2">Service at Your Doorstep</h3>
                        <p className="text-sm opacity-70">
                            We currently cover 64 districts, so help is never far away.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-16 bg-base-200 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-semibold">Ready to get your device fixed?</h3>
                <p className="mt-2 opacity-70">
                    Create a repair request and our team will take care of the rest.
                </p>
                <Link to="/dashboard/create-request" className="btn btn-primary mt-6 text-black">
                    Create a Repair Request
                </Link>
            </div>
        </div>
    );
};

export default About;
