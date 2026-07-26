import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import { MdPayment } from 'react-icons/md';
import { FaLock } from 'react-icons/fa';

const Payment = () => {
    const { requestId } = useParams();
    const axiosSecure = useAxiosSecure();

    const { isLoading, data: request } = useQuery({
        queryKey: ['parcels', requestId],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/${requestId}`);
            return res.data;
        }
    })

    const handlePayment = async() => {
        const paymentInfo = {
            cost: request.cost,
            parcelId: request._id,
            senderEmail: request.senderEmail,
            parcelName: request.parcelName
        }

        const res = await axiosSecure.post('/create-checkout-session', paymentInfo);

        console.log(res.data);

        window.location.href = res.data.url;
    }

    if (isLoading) {
        return <Loading></Loading>
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200 rounded-2xl p-4 md:p-8 w-full max-w-md">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body items-center text-center">
                        <div className="bg-primary/10 rounded-full p-4">
                            <MdPayment className="text-4xl text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold mt-2">Complete Your Payment</h2>

                        <div className="w-full mt-4 text-left bg-base-200 rounded-xl p-4 space-y-2">
                            {
                                request?.parcelName &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Repair Request</span>
                                    <span className="font-semibold text-right">{request.parcelName}</span>
                                </div>
                            }
                            {
                                request?.receiverRegion &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Device Category</span>
                                    <span className="font-semibold text-right">{request.receiverRegion}</span>
                                </div>
                            }
                            {
                                request?.priority &&
                                <div className="flex justify-between gap-4">
                                    <span className="opacity-70">Priority</span>
                                    <span className="font-semibold text-right capitalize">{request.priority}</span>
                                </div>
                            }
                        </div>

                        <div className="w-full mt-6">
                            <p className="opacity-70">Amount Payable</p>
                            <p className="text-4xl font-bold text-primary">${request.cost}</p>
                        </div>

                        <button onClick={handlePayment} className="btn btn-primary text-black w-full mt-6">Pay Now</button>

                        <p className="flex items-center justify-center gap-2 text-xs opacity-60 mt-4">
                            <FaLock />
                            Secure payment powered by Stripe
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
