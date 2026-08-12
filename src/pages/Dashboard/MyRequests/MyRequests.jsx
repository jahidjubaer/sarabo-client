import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { MotionConfig } from 'motion/react';
import { Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { CardSkeleton } from '../../../components/common/Skeletons';
import { buttonVariants } from '../../../components/ui/button-variants';
import { RequestFilters } from '../../../components/customer/RequestFilters';
import { RequestList } from '../../../components/customer/RequestList';
import { notify } from '../../../lib/notify';
import { getPaymentErrorMessage } from '../../../utils/paymentErrorMessage';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { getDeletionErrorMessage } from '../../../utils/deletionErrorMessage';
import { deleteRepairRequest } from '../../../api/repairRequests';
import { removeDeletedRequestCaches } from '../../../utils/removeDeletedRequestCaches';
import { applyRequestView } from '../../../utils/customerRequestPresentation';
import { isUserEmailVerified } from '../../../utils/emailVerification';

// Phase 7.3: My Requests redesigned onto the design system (no DaisyUI here).
// Deletion / cancellation / payment BUSINESS behaviour is unchanged - the same
// authority helpers (canCancelRequest / canDeleteRequest inside the list item),
// the same APIs, the same cache removal (removeDeletedRequestCaches), the same
// error mappers. Only the presentation and the success/error feedback surface
// (SweetAlert confirm kept for destructive actions; toast for the outcome)
// changed. Search/filter/sort are pure client-side operations over the
// already-loaded list (see utils/customerRequestPresentation.js).
const MyRequests = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    // Phase 8.1A: an unverified customer can still READ their requests, but the
    // cancel/delete mutations are server-gated (403 EMAIL_NOT_VERIFIED). Match
    // that in the UI - route them to verification instead of firing a mutation
    // that will be rejected. Returns true when the action was intercepted.
    const guardVerified = () => {
        if (!isUserEmailVerified(user)) {
            navigate('/verify-email', { state: location.pathname });
            return true;
        }
        return false;
    };

    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('all');
    const [sort, setSort] = useState('newest');
    const [payingId, setPayingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const { data: requests = [], refetch, isLoading, isError } = useQuery({
        queryKey: ['my-requests', user?.email],
        queryFn: async () => {
            // No email in the URL - the server scopes a non-admin caller to
            // their own token-derived identity.
            const res = await axiosSecure.get('/repair-requests');
            return res.data;
        },
    });

    const visibleRequests = useMemo(
        () => applyRequestView(requests, { search, group, sort }),
        [requests, search, group, sort]
    );

    const clearFilters = () => {
        setSearch('');
        setGroup('all');
        setSort('newest');
    };

    const handleCancelRequest = (request) => {
        if (cancellingId) return;
        if (guardVerified()) return;
        Swal.fire({
            title: 'Cancel this repair request?',
            text: "This is final - once cancelled, this request cannot be reopened. Assigned or in-progress repairs can no longer be cancelled here, and paid requests require support for cancellation or a refund.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel request',
        }).then((result) => {
            if (!result.isConfirmed) return;
            setCancellingId(request._id);
            axiosSecure.patch(`/repair-requests/${request._id}/cancel`)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                    queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
                    refetch();
                    notify.success('Your repair request has been cancelled.');
                })
                .catch((error) => {
                    if (import.meta.env.DEV) console.error('Cancellation failed:', error);
                    notify.error(getCancellationErrorMessage(error));
                })
                .finally(() => setCancellingId(null));
        });
    };

    const handleDeleteRequest = (request) => {
        if (deletingId) return;
        if (guardVerified()) return;
        Swal.fire({
            title: 'Delete repair request?',
            text: 'This permanently removes the request and its photos. This cannot be undone. Once a technician, inspection, quote, or payment exists, a request can no longer be deleted - cancel it instead.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it',
        }).then((result) => {
            if (!result.isConfirmed) return;
            setDeletingId(request._id);
            deleteRepairRequest(axiosSecure, request._id)
                .then(() => {
                    // The request is gone server-side - drop every request-specific
                    // private cache branch (incl. signed image URLs) from memory now.
                    removeDeletedRequestCaches(queryClient, request._id);
                    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                    refetch();
                    notify.success('Your repair request has been deleted.');
                })
                .catch((error) => {
                    if (import.meta.env.DEV) console.error('Deletion failed:', error);
                    notify.error(getDeletionErrorMessage(error));
                })
                .finally(() => setDeletingId(null));
        });
    };

    // Only the request id is sent - amount and identity are resolved server-side.
    const handlePayment = async (request) => {
        if (payingId) return;
        setPayingId(request._id);
        try {
            const res = await axiosSecure.post('/payment-checkout-session', { requestId: request._id });
            window.location.assign(res.data.url);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Checkout session creation failed:', error);
            notify.error(getPaymentErrorMessage(error));
            setPayingId(null);
        }
    };

    const newRequestAction = (
        <Link to="/dashboard/create-request" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            New Repair Request
        </Link>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="My Requests" actions={newRequestAction} />
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((key) => <CardSkeleton key={key} className="h-24" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="My Requests" actions={newRequestAction} />
                <ErrorState
                    title="Couldn't load your requests"
                    description="We couldn't load your repair requests right now. Please try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const total = requests.length;
    const description = total === 0
        ? 'You have not created any repair requests yet.'
        : `${total} repair request${total === 1 ? '' : 's'}`;

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="My Requests" description={description} actions={newRequestAction} />

                {total === 0 ? (
                    <EmptyState
                        title="No repair requests yet"
                        description="When you request a repair, it will appear here so you can track its progress."
                        action={
                            <Link to="/dashboard/create-request" className={buttonVariants({ size: 'sm' })}>
                                <Plus aria-hidden="true" />
                                Create repair request
                            </Link>
                        }
                    />
                ) : (
                    <>
                        <RequestFilters
                            search={search}
                            onSearchChange={setSearch}
                            group={group}
                            onGroupChange={setGroup}
                            sort={sort}
                            onSortChange={setSort}
                        />
                        <RequestList
                            requests={visibleRequests}
                            onClearFilters={clearFilters}
                            onCancel={handleCancelRequest}
                            onDelete={handleDeleteRequest}
                            onPay={handlePayment}
                            cancellingId={cancellingId}
                            deletingId={deletingId}
                            payingId={payingId}
                        />
                    </>
                )}
            </div>
        </MotionConfig>
    );
};

export default MyRequests;
