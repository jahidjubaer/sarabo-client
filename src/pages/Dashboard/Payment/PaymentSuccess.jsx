import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState({});
    const sessionId = searchParams.get('session_id');
    const axiosSecure = useAxiosSecure();

    // console.log(sessionId);

    useEffect(() => {
        if (sessionId) {
            axiosSecure.patch(`/payment-success?session_id=${sessionId}`)
                .then(res => {
                    console.log(res.data)
                    setPaymentInfo({
                        transactionId: res.data.transactionId,
                        trackingId : res.data.trackingId
                    })
                })
        }

    }, [sessionId, axiosSecure])

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body items-center text-center">
                        <div className="bg-success/10 rounded-full p-4">
                            <FaCheckCircle className="text-4xl text-success" />
                        </div>
                        <h2 className="text-3xl font-bold mt-2">Payment Successful</h2>
                        <p className="opacity-70">Thank you! Your payment has been confirmed.</p>

                        {
                            (paymentInfo.transactionId || paymentInfo.trackingId) &&
                            <div className="w-full mt-4 text-left bg-base-200 rounded-xl p-4 space-y-2">
                                {
                                    paymentInfo.transactionId &&
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-70">Transaction ID</span>
                                        <span className="font-semibold text-right break-all">{paymentInfo.transactionId}</span>
                                    </div>
                                }
                                {
                                    paymentInfo.trackingId &&
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-70">Request ID</span>
                                        <span className="font-semibold text-right break-all">{paymentInfo.trackingId}</span>
                                    </div>
                                }
                            </div>
                        }

                        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                            <Link to="/dashboard/my-requests" className="btn btn-primary text-black flex-1">View My Requests</Link>
                            <Link to="/dashboard" className="btn btn-outline flex-1">Go to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
