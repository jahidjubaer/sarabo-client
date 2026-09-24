import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { MotionConfig } from 'motion/react';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
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
import { applyRequestView, getRequestGroup } from '../../../utils/customerRequestPresentation';
import { isUserEmailVerified } from '../../../utils/emailVerification';
import { createV2Checkout } from '../../../api/payments';

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
    const [confirmAction, setConfirmAction] = useState(null);
    const requestsQueryKey = ['my-requests', user?.email];

    const { data: requestsData, refetch, isPending, isPaused, isError } = useQuery({
        queryKey: requestsQueryKey,
        queryFn: async () => {
            // No email in the URL - the server scopes a non-admin caller to
            // their own token-derived identity.
            const res = await axiosSecure.get('/repair-requests');
            return res.data;
        },
    });
    const hasUsableRequests = Array.isArray(requestsData);
    const requests = useMemo(() => (Array.isArray(requestsData) ? requestsData : []), [requestsData]);
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableRequests;
    const retryRequests = () => queryClient.resetQueries({ queryKey: requestsQueryKey });

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
        setConfirmAction({ kind: 'cancel', request });
    };

    const runCancelRequest = (request) => {
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
            .finally(() => {
                setCancellingId(null);
                setConfirmAction(null);
            });
    };

    const handleDeleteRequest = (request) => {
        if (deletingId) return;
        if (guardVerified()) return;
        setConfirmAction({ kind: 'delete', request });
    };

    const runDeleteRequest = (request) => {
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
            .finally(() => {
                setDeletingId(null);
                setConfirmAction(null);
            });
    };

    const confirmDialog = (
        <ConfirmDialog
            open={Boolean(confirmAction)}
            onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
            title={confirmAction?.kind === 'delete' ? 'Delete this repair request?' : 'Cancel this repair request?'}
            description={confirmAction?.kind === 'delete'
                ? 'This permanently removes the request and its photos. It cannot be undone. Once a technician, inspection, quote or payment exists, a request can no longer be deleted - cancel it instead.'
                : 'This is final - a cancelled request cannot be reopened. Assigned or in-progress repairs can no longer be cancelled here, and paid requests need support for cancellation or a refund.'}
            confirmLabel={confirmAction?.kind === 'delete' ? 'Delete request' : 'Cancel request'}
            cancelLabel="Keep request"
            destructive
            busy={Boolean(cancellingId || deletingId)}
            onConfirm={() => {
                if (confirmAction?.kind === 'delete') runDeleteRequest(confirmAction.request);
                else if (confirmAction) runCancelRequest(confirmAction.request);
            }}
        />
    );

    // Only the request id is sent - amount and identity are resolved server-side.
    // canOfferPayment only offers Pay for a v2 request whose quote is approved,
    // so this uses the v2 approved-quote checkout - the same call the request
    // details page makes. (It previously posted to the legacy
    // /payment-checkout-session, which rejects every v2 request.)
    const handlePayment = async (request) => {
        if (payingId) return;
        setPayingId(request._id);
        try {
            const { url } = await createV2Checkout(axiosSecure, request._id);
            if (!url) throw new Error('missing checkout url');
            window.location.assign(url);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Checkout session creation failed:', error);
            notify.error(getPaymentErrorMessage(error));
            setPayingId(null);
        }
    };

    const newRequestAction = (
        <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'primary' })}>
            <Plus aria-hidden="true" />
            New request
        </Link>
    );

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="My repairs" actions={newRequestAction} />
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((key) => <CardSkeleton key={key} className="h-24" />)}
                </div>
            </div>
        );
    }

    if (isError || isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="My repairs" actions={newRequestAction} />
                <ErrorState
                    title="Couldn't load your requests"
                    description="We couldn't load your repair requests right now. Please try again."
                    onRetry={retryRequests}
                />
            </div>
        );
    }

    const total = requests.length;
    const groupCounts = requests.reduce((counts, request) => {
        const key = getRequestGroup(request);
        return { ...counts, [key]: (counts[key] || 0) + 1 };
    }, { all: total, 'needs-action': 0, active: 0, completed: 0, closed: 0 });
    const description = total === 0
        ? 'You have not created any repair requests yet.'
        : `${total} repair request${total === 1 ? '' : 's'}`;

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader title="My repairs" description={description} actions={newRequestAction} />

                {total === 0 ? (
                    <EmptyState
                        title="No repair requests yet"
                        description="When you request a repair, it will appear here so you can track its progress."
                        className="py-16"
                        action={
                            <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'action', size: 'sm' })}>
                                <Plus aria-hidden="true" />
                                Create repair request
                            </Link>
                        }
                    />
                ) : (
                    <>
                        <RequestFilters
                            counts={groupCounts}
                            search={search}
                            onSearchChange={setSearch}
                            group={group}
                            onGroupChange={setGroup}
                            sort={sort}
                            onSortChange={setSort}
                        />
                        <p role="status" className="sr-only">
                            {visibleRequests.length} of {total} request{total === 1 ? '' : 's'} shown
                        </p>
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
            {confirmDialog}
        </MotionConfig>
    );
};

export default MyRequests;
