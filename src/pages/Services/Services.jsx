import React from 'react';
import { Link } from 'react-router';
import { FaSnowflake, FaTv, FaMobileAlt, FaLaptop, FaTools } from 'react-icons/fa';
import { GiWashingMachine } from 'react-icons/gi';
import { MdKitchen, MdMicrowave } from 'react-icons/md';

const services = [
    {
        label: 'AC',
        icon: FaSnowflake,
        description: 'Installation, gas refilling, cooling issues and general maintenance for split and window ACs.'
    },
    {
        label: 'Refrigerator',
        icon: MdKitchen,
        description: 'Cooling problems, compressor issues, gas leakage and routine refrigerator servicing.'
    },
    {
        label: 'Washing Machine',
        icon: GiWashingMachine,
        description: 'Drum, motor, drainage and control panel repairs for top-load and front-load machines.'
    },
    {
        label: 'TV / Electronics',
        icon: FaTv,
        description: 'Display, sound and connectivity issues for TVs and other home electronics.'
    },
    {
        label: 'Mobile Phone',
        icon: FaMobileAlt,
        description: 'Screen, battery, charging port and software troubleshooting for smartphones.'
    },
    {
        label: 'Laptop / Computer',
        icon: FaLaptop,
        description: 'Hardware diagnostics, performance issues and general repair for laptops and desktops.'
    },
    {
        label: 'Microwave',
        icon: MdMicrowave,
        description: 'Heating, turntable and control issues fixed for all microwave oven brands.'
    },
    {
        label: 'Other',
        icon: FaTools,
        description: 'Have another appliance that needs a technician? We handle a wide range of repairs.'
    },
];

const Services = () => {
    return (
        <div className="px-4 py-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl font-bold">Our Repair Services</h2>
                <p className="mt-4 opacity-70">
                    From home appliances to personal electronics, our verified technicians
                    come to your doorstep to diagnose and fix the problem. Pick a category
                    below to get started.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {
                    services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <div key={index} className="card bg-base-200 shadow-sm hover:shadow-md transition">
                                <div className="card-body items-center text-center">
                                    <div className="bg-base-100 rounded-full p-4">
                                        <Icon className="text-4xl text-primary" />
                                    </div>
                                    <h3 className="card-title mt-2">{service.label}</h3>
                                    <p className="text-sm opacity-70">{service.description}</p>
                                    <div className="card-actions mt-4">
                                        <Link to="/dashboard/create-request" className="btn btn-primary btn-sm text-black">
                                            Request this service
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            <div className="mt-16 bg-base-200 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-semibold">Can't find your device category?</h3>
                <p className="mt-2 opacity-70">
                    No problem — choose "Other" when creating a request and describe the issue,
                    and we'll match you with the right technician.
                </p>
                <Link to="/dashboard/create-request" className="btn btn-primary mt-6 text-black">
                    Create a Repair Request
                </Link>
            </div>
        </div>
    );
};

export default Services;
