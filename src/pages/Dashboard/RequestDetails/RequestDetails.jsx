import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { MotionConfig } from 'motion/react';
import { History, Ban, CreditCard } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { DetailSkeleton } from '../../../components/common/Skeletons';
import { ErrorState } from '../../../components/common/ErrorState';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { buttonVariants } from '../../../components/ui/button-variants';
import { RepairWorkspaceHeader } from '../../../components/workspace/RepairWorkspaceHeader';
import { CustomerRequestDetailsView } from '../../../components/customer/CustomerRequestDetailsView';
import { TechnicianRequestDetailsView } from '../../../components/technician/TechnicianRequestDetailsView';
import { AdminRequestDetailsView } from '../../../components/admin/AdminRequestDetailsView';
import { notify } from '../../../lib/notify';
import { getViewerRole, getSectionVisibility, isLegacyRequest } from '../../../utils/workspacePresentation';
import { getStatusPresentation } from '../../../config/statusPresentation';
import { canCancelRequest } from '../../../utils/cancellationEligibility';
import { isUserEmailVerified } from '../../../utils/emailVerification';
import { canEditDamageImages } from '../../../utils/damageImageValidation';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { getRepairStatusActionErrorMessage } from '../../../utils/repairStatusActionErrorMessage';
import { validateRejectionReason, getAssignmentDecisionErrorMessage } from '../../../utils/assignmentDecision';

// Phase 7.6: the shared repair workspace (customer / assigned technician /
// admin, distinguished by route as before). All eligibility flags are preserved
// exactly; the server re-authorizes every action. Legacy requests render only
// the sections meaningful to their data (no empty v2 workflow panels). The
// early technician status progression (driver_assigned → rider_arriving →
// device received) now lives here via the existing PATCH /repair-requests/:id/status.
const RequestDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [cancelling, setCancelling] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [deciding, setDeciding] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const isAdminContext = location.pathname.startsWith('/dashboard/manage-repair-requests');
    const isTechnicianContext = location.pathname.startsWith('/dashboard/assigned-jobs');
    const backTo = isAdminContext ? '/dashboard/manage-repair-requests' : (isTechnicianContext ? '/dashboard/assigned-jobs' : '/dashboard/my-requests');
    const backLabel = isAdminContext ? 'Back to Repair Requests' : (isTechnicianContext ? 'Back to Assigned Jobs' : 'Back to My Requests');
    const requestQueryKey = ['repair-requests', id];

    const { data: request, isPending, isPaused, isError, refetch } = useQuery({
        queryKey: requestQueryKey,
        queryFn: async () => (await axiosSecure.get(`/repair-requests/${id}`)).data,
        retry: false,
    });
    const hasUsableRequest = request !== undefined && request !== null;
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableRequest;
    const retryRequest = () => queryClient.resetQueries({ queryKey: requestQueryKey });

    if (isInitialLoading) {
        return <div className="space-y-6"><DetailSkeleton /></div>;
    }

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <ErrorState
                    title="Couldn't load this repair request"
                    description="We couldn't load this request right now. Please try again."
                    onRetry={retryRequest}
                    secondaryAction={<Link to={backTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{backLabel}</Link>}
                    // This branch replaces the whole route, so no other heading
                    // is rendered - the state title IS the page heading here.
                    headingLevel={1}
                />
            </div>
        );
    }

    if (isError || !request) {
        return (
            <div className="space-y-6">
                <ErrorState
                    title="Repair request not found"
                    description="This request may have been removed, or you may not have access to it."
                    secondaryAction={<Link to={backTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{backLabel}</Link>}
                    headingLevel={1}
                />
            </div>
        );
    }

    const isCancelled = request.deliveryStatus === 'cancelled';
    const isOwner = request.senderEmail === user?.email;
    const isV2Request = !isLegacyRequest(request);
    const damageImagesEditable = isOwner && !isAdminContext && canEditDamageImages(request);
    const isTechnicianViewer = isTechnicianContext && request.technicianEmail === user?.email;
    const isAssignedTechnicianView = isV2Request && isTechnicianViewer;
    const canInspect = isAssignedTechnicianView && request.deliveryStatus === 'parcel_picked_up';
    const canSubmitQuote = isAssignedTechnicianView && request.deliveryStatus === 'inspection_completed';

    const viewerRole = getViewerRole({ isAssignedTechnicianView, isAdminContext, isOwner });
    const sections = getSectionVisibility({ request, isOwner, isCancelled });
    // Legacy technician generic-status progression is offered to the assigned
    // technician too (the workspace is reached via assigned-jobs/:id); the panel
    // decides whether an advance exists for the current status.
    const technicianCanAdvance = isTechnicianViewer && !isCancelled;

    const handleAdvance = (nextStatus) => {
        if (advancing) return;
        setAdvancing(true);
        axiosSecure.patch(`/repair-requests/${id}/status`, { deliveryStatus: nextStatus })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['repair-requests', id] });
                queryClient.invalidateQueries({ queryKey: ['tech-active-jobs', user?.email] });
                refetch();
                notify.success(`Updated: ${getStatusPresentation(nextStatus).label}`);
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Repair status update failed:', error);
                notify.error(getRepairStatusActionErrorMessage(error));
                refetch();
            })
            .finally(() => setAdvancing(false));
    };

    // Phase 8.2: technician accepts the offered assignment (assignment_pending
    // -> driver_assigned). Server is authoritative + resolves concurrency; a
    // concurrent decision surfaces as a safe mapped message.
    const handleAccept = () => {
        if (deciding) return;
        setDeciding(true);
        axiosSecure.post(`/repair-requests/${id}/assignment/accept`)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['repair-requests', id] });
                queryClient.invalidateQueries({ queryKey: ['tech-active-jobs', user?.email] });
                refetch();
                notify.success('Assignment accepted.');
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Accept assignment failed:', error);
                notify.error(getAssignmentDecisionErrorMessage(error));
                refetch();
            })
            .finally(() => setDeciding(false));
    };

    // Technician rejects the offered assignment with a reason (assignment_pending
    // -> pending-pickup; the request becomes reassignable and the technician is
    // released). On success we leave the (now un-assigned) request and return to
    // Assigned Jobs, since it is no longer theirs.
    const handleRejectConfirm = (reason) => {
        if (deciding) return;
        setDeciding(true);
        axiosSecure.post(`/repair-requests/${id}/assignment/reject`, { reason })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['tech-active-jobs', user?.email] });
                setRejectOpen(false);
                notify.success('Assignment rejected. The request has been returned for reassignment.');
                navigate('/dashboard/assigned-jobs', { replace: true });
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Reject assignment failed:', error);
                setRejectOpen(false);
                notify.error(getAssignmentDecisionErrorMessage(error));
                refetch();
            })
            .finally(() => setDeciding(false));
    };

    // Phase 8.1A: an unverified owner can still READ this page, but the cancel
    // mutation is server-gated (403 EMAIL_NOT_VERIFIED). Match that in the UI -
    // route them to verification instead of opening a confirm they can't
    // complete. Verified users open the ConfirmDialog as before.
    const handleCancelClick = () => {
        if (!isUserEmailVerified(user)) {
            navigate('/verify-email', { state: location.pathname });
            return;
        }
        setCancelOpen(true);
    };

    // Migrated from SweetAlert to the design-system ConfirmDialog (Phase 7.9).
    // Same eligibility gate (canCancelRequest, below), same PATCH /repair-requests/:id/
    // cancel mutation, same invalidations and Toastify feedback - the server
    // re-authorizes and the business rules are unchanged; only the confirmation
    // surface changed.
    const performCancel = () => {
        if (cancelling) return;
        setCancelling(true);
        axiosSecure.patch(`/repair-requests/${id}/cancel`)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['repair-requests', id] });
                queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                refetch();
                setCancelOpen(false);
                notify.success('Your repair request has been cancelled.');
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Cancellation failed:', error);
                setCancelOpen(false);
                notify.error(getCancellationErrorMessage(error));
            })
            .finally(() => setCancelling(false));
    };

    // Secondary actions go in the header's "More" menu; only the legacy
    // (pre-quote) payment stays a visible button, because it is that request's
    // next step. Eligibility gates are unchanged.
    const headerMenu = [
        { label: 'Public tracking page', icon: History, to: `/track-request/${request.trackingId}` },
        ...(isOwner && canCancelRequest(request)
            ? [{ label: cancelling ? 'Cancelling…' : 'Cancel request', icon: Ban, onSelect: handleCancelClick, destructive: true, disabled: cancelling }]
            : []),
    ];
    const headerPrimary = isOwner && !isV2Request && request.paymentStatus !== 'paid' && !isCancelled ? (
        <Link to={`/dashboard/payment/${request._id}`} className={buttonVariants({ variant: 'action', size: 'sm' })}>
            <CreditCard aria-hidden="true" /> Pay now
        </Link>
    ) : null;

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <RepairWorkspaceHeader request={request} backTo={backTo} backLabel={backLabel} audience={viewerRole} primaryAction={headerPrimary} menuItems={headerMenu} />

                {viewerRole === 'customer' ? (
                    <CustomerRequestDetailsView
                        request={request}
                        sections={sections}
                        isV2Request={isV2Request}
                        damageImagesEditable={damageImagesEditable}
                    />
                ) : isTechnicianViewer ? (
                    <TechnicianRequestDetailsView
                        request={request}
                        sections={sections}
                        isV2Request={isV2Request}
                        damageImagesEditable={damageImagesEditable}
                        isAssignedTechnicianView={isAssignedTechnicianView}
                        technicianCanAdvance={technicianCanAdvance}
                        canInspect={canInspect}
                        canSubmitQuote={canSubmitQuote}
                        onAdvance={handleAdvance}
                        advancing={advancing}
                        onAccept={handleAccept}
                        onReject={() => setRejectOpen(true)}
                        deciding={deciding}
                    />
                ) : viewerRole === 'admin' ? (
                    <AdminRequestDetailsView
                        request={request}
                        sections={sections}
                        isV2Request={isV2Request}
                    />
                ) : (
                    // Not the owner, the assigned technician or an admin: the
                    // server refuses this read, so this is only reached if it
                    // ever did not. Show nothing of the request.
                    <ErrorState
                        title="Repair request not available"
                        description="You do not have access to this repair request."
                        secondaryAction={<Link to={backTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{backLabel}</Link>}
                    />
                )}
            </div>

            <ConfirmDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Cancel this repair request?"
                description="This is final - once cancelled, this request cannot be reopened. Assigned or in-progress repairs can no longer be cancelled here, and paid requests require support for cancellation or a refund."
                confirmLabel="Yes, cancel request"
                destructive
                busy={cancelling}
                onConfirm={performCancel}
            />

            <ConfirmDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                title="Reject this assignment?"
                description="Let the team know why you can't take this repair. The request will be returned for reassignment."
                confirmLabel="Reject assignment"
                destructive
                busy={deciding}
                reason
                reasonLabel="Reason for rejecting"
                reasonPlaceholder="e.g. Outside my current service area"
                validateReason={validateRejectionReason}
                onConfirm={handleRejectConfirm}
            />
        </MotionConfig>
    );
};

export default RequestDetails;
