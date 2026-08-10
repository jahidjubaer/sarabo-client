import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { MotionConfig, motion as Motion } from 'motion/react';
import { History, Ban, CreditCard } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { DetailSkeleton } from '../../../components/common/Skeletons';
import { ErrorState } from '../../../components/common/ErrorState';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { buttonVariants } from '../../../components/ui/button-variants';
import { RepairWorkspaceHeader } from '../../../components/workspace/RepairWorkspaceHeader';
import { RepairLifecycleTimeline } from '../../../components/workspace/RepairLifecycleTimeline';
import { CurrentStageActionPanel } from '../../../components/workspace/CurrentStageActionPanel';
import { WorkspaceContextPanels } from '../../../components/workspace/WorkspaceContextPanels';
import DamageImageManager from '../../../components/damage-images/DamageImageManager';
import InspectionSection from '../../../components/inspection/InspectionSection';
import QuoteSection from '../../../components/quote/QuoteSection';
import V2PaymentSection from '../../../components/payment/V2PaymentSection';
import RepairSection from '../../../components/repair/RepairSection';
import { notify } from '../../../lib/notify';
import { getViewerRole, getSectionVisibility, isLegacyRequest } from '../../../utils/workspacePresentation';
import { getStatusPresentation } from '../../../config/statusPresentation';
import { canCancelRequest } from '../../../utils/cancellationEligibility';
import { isUserEmailVerified } from '../../../utils/emailVerification';
import { canEditDamageImages } from '../../../utils/damageImageValidation';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { getRepairStatusActionErrorMessage } from '../../../utils/repairStatusActionErrorMessage';
import { staggerContainer, staggerItem } from '../../../theme/motion';

function SectionCard({ title, children }) {
    return (
        <Card>
            <CardContent className="space-y-4 p-5">
                <h2 className="text-sm font-semibold text-ds-foreground">{title}</h2>
                {children}
            </CardContent>
        </Card>
    );
}

// Phase 7.6: the shared repair workspace (customer / assigned technician /
// admin, distinguished by route as before). All eligibility flags are preserved
// exactly; the server re-authorizes every action. Legacy requests render only
// the sections meaningful to their data (no empty v2 workflow panels). The
// early technician status progression (driver_assigned → rider_arriving →
// device received) now lives here via the existing PATCH /parcels/:id/status.
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

    const isAdminContext = location.pathname.startsWith('/dashboard/manage-repair-requests');
    const isTechnicianContext = location.pathname.startsWith('/dashboard/assigned-jobs');
    const backTo = isAdminContext ? '/dashboard/manage-repair-requests' : (isTechnicianContext ? '/dashboard/assigned-jobs' : '/dashboard/my-requests');
    const backLabel = isAdminContext ? 'Back to Repair Requests' : (isTechnicianContext ? 'Back to Assigned Jobs' : 'Back to My Requests');

    const { data: request, isLoading, isError, refetch } = useQuery({
        queryKey: ['parcels', id],
        queryFn: async () => (await axiosSecure.get(`/parcels/${id}`)).data,
        retry: false,
    });

    if (isLoading) {
        return <div className="space-y-6"><DetailSkeleton /></div>;
    }

    if (isError || !request) {
        return (
            <div className="space-y-6">
                <ErrorState
                    title="Repair request not found"
                    description="This request may have been removed, or you may not have access to it."
                    secondaryAction={<Link to={backTo} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{backLabel}</Link>}
                />
            </div>
        );
    }

    const isCancelled = request.deliveryStatus === 'cancelled';
    const isOwner = request.senderEmail === user?.email;
    const isV2Request = !isLegacyRequest(request);
    const damageImagesEditable = isOwner && !isAdminContext && canEditDamageImages(request);
    const isAssignedTechnicianView = isV2Request && isTechnicianContext && request.riderEmail === user?.email;
    const canInspect = isAssignedTechnicianView && request.deliveryStatus === 'parcel_picked_up';
    const canSubmitQuote = isAssignedTechnicianView && request.deliveryStatus === 'inspection_completed';

    const viewerRole = getViewerRole({ isAssignedTechnicianView, isAdminContext, isOwner });
    const sections = getSectionVisibility({ request, isOwner, isCancelled });
    // Legacy technician generic-status progression is offered to the assigned
    // technician too (the workspace is reached via assigned-jobs/:id); the panel
    // decides whether an advance exists for the current status.
    const technicianCanAdvance = isTechnicianContext && request.riderEmail === user?.email && !isCancelled;

    const handleAdvance = (nextStatus) => {
        if (advancing) return;
        setAdvancing(true);
        axiosSecure.patch(`/parcels/${id}/status`, { deliveryStatus: nextStatus })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['parcels', id] });
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
    // Same eligibility gate (canCancelRequest, below), same PATCH /parcels/:id/
    // cancel mutation, same invalidations and Toastify feedback - the server
    // re-authorizes and the business rules are unchanged; only the confirmation
    // surface changed.
    const performCancel = () => {
        if (cancelling) return;
        setCancelling(true);
        axiosSecure.patch(`/parcels/${id}/cancel`)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['parcels', id] });
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

    const headerAction = (
        <>
            <Link to={`/track-request/${request.trackingId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <History aria-hidden="true" /> Timeline
            </Link>
            {isOwner && !isV2Request && request.paymentStatus !== 'paid' && !isCancelled && (
                <Link to={`/dashboard/payment/${request._id}`} className={buttonVariants({ size: 'sm' })}>
                    <CreditCard aria-hidden="true" /> Pay now
                </Link>
            )}
            {isOwner && canCancelRequest(request) && (
                <Button variant="outline" size="sm" className="text-ds-destructive hover:text-ds-destructive" onClick={handleCancelClick} disabled={cancelling}>
                    <Ban aria-hidden="true" /> {cancelling ? 'Cancelling…' : 'Cancel'}
                </Button>
            )}
        </>
    );

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <RepairWorkspaceHeader request={request} backTo={backTo} backLabel={backLabel} action={headerAction} />

                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-3">
                    <Motion.div variants={staggerItem} className="space-y-6 lg:col-span-2">
                        <CurrentStageActionPanel
                            request={request}
                            viewerRole={viewerRole}
                            isAssignedTechnicianView={technicianCanAdvance}
                            onAdvance={handleAdvance}
                            advancing={advancing}
                        />

                        {sections.showDamage && (
                            <SectionCard title="Damage photos">
                                <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />
                            </SectionCard>
                        )}
                        {sections.showInspection && (
                            <SectionCard title="Inspection">
                                <InspectionSection requestId={request._id} canInspect={canInspect} isAssignedTechnicianView={isAssignedTechnicianView} />
                            </SectionCard>
                        )}
                        {sections.showQuote && (
                            <SectionCard title="Repair quote">
                                <QuoteSection requestId={request._id} isOwner={isOwner} canSubmitQuote={canSubmitQuote} isAssignedTechnicianView={isAssignedTechnicianView} />
                            </SectionCard>
                        )}
                        {sections.showPayment && <V2PaymentSection requestId={request._id} />}
                        {sections.showRepair && (
                            <SectionCard title="Repair">
                                <RepairSection requestId={request._id} canManage={isAssignedTechnicianView} deliveryStatus={request.deliveryStatus} />
                            </SectionCard>
                        )}

                        {!isV2Request && (
                            <SectionCard title="Repair request">
                                <p className="text-sm text-ds-muted-foreground">
                                    This is an earlier repair request. Inspection, quotes, and the newer repair workflow are available for requests created after the latest update.
                                </p>
                            </SectionCard>
                        )}
                    </Motion.div>

                    <Motion.div variants={staggerItem} className="space-y-4">
                        <RepairLifecycleTimeline request={request} />
                        <WorkspaceContextPanels request={request} showCustomer={isAdminContext || isAssignedTechnicianView} />
                    </Motion.div>
                </Motion.div>
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
        </MotionConfig>
    );
};

export default RequestDetails;
