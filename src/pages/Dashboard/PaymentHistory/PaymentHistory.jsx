import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { formatMoney } from '../../../utils/currency';

const PaymentHistory = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const paymentsQueryKey = ['payments', user.email];

    const paymentsQuery = useQuery({
        queryKey: paymentsQueryKey,
        queryFn: async () => {
            // No email in the request URL - the server already scopes a
            // non-admin caller to their own token-derived identity.
            const res = await axiosSecure.get('/payments')
            return res.data;
        }
    })

    const hasUsablePayments = Array.isArray(paymentsQuery.data);
    const payments = hasUsablePayments ? paymentsQuery.data : [];
    const isInitialLoading = paymentsQuery.isPending && !paymentsQuery.isPaused && !hasUsablePayments;
    const isUnavailableBeforeData = paymentsQuery.isPaused && !hasUsablePayments;
    const isErrorBeforeData = paymentsQuery.isError && !hasUsablePayments;
    const retryPayments = () => queryClient.resetQueries({ queryKey: paymentsQueryKey });

    if (isInitialLoading) {
        return <Loading></Loading>
    }

    if (isUnavailableBeforeData || isErrorBeforeData) {
        return (
            <ErrorState
                title="Couldn't load payment history"
                description="Your payment history is unavailable right now. Please try again."
                onRetry={retryPayments}
            />
        );
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Payment History: {payments.length}</h2>
            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Paid Time</th>
                            <th>Transaction Id</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            payments.map((payment, index) => <tr key={payment._id}>
                                <th>{index + 1}</th>
                                <td>{payment.customerEmail}</td>
                                {/* Phase 8.10: format each payment in its OWN persisted
                                    currency (canonical V2 = BDT -> ৳; legacy V1 = USD -> $).
                                    No conversion, no relabeling. formatMoney returns '' for a
                                    non-finite amount, so fall back to a dash placeholder. */}
                                <td>{formatMoney(payment.amount, payment.currency) || '—'}</td>
                                <td>{payment.paidAt}</td>
                                <td>{payment.transactionId}</td>
                            </tr>)
                        }


                    </tbody>
                </table>
                {
                    payments.length === 0 && <p className='text-center py-8 opacity-60'>No payments have been made yet.</p>
                }
            </div>
        </div>
    );
};

export default PaymentHistory;
