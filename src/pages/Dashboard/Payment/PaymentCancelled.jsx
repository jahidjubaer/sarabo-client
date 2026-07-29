import React from 'react';
import { Link } from 'react-router';
import { FaExclamationTriangle } from 'react-icons/fa';

const PaymentCancelled = () => {
    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body items-center text-center">
                        <div className="bg-warning/10 rounded-full p-4">
                            <FaExclamationTriangle className="text-4xl text-warning" />
                        </div>
                        <h2 className="text-3xl font-bold mt-2">Payment Cancelled</h2>
                        <p className="opacity-70">
                            Payment cancelled - no charge was recorded.
                            You can try again anytime from My Repair Requests.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                            <Link to="/dashboard/my-requests" className="btn btn-primary flex-1">Return to My Repair Requests</Link>
                            <Link to="/dashboard" className="btn btn-outline flex-1">Go to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelled;
