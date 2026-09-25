import { Link } from 'react-router';
import { motion as Motion } from 'motion/react';
import { UserCog } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import ServiceSpine from '../spine/ServiceSpine';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import TechnicianEarningSettlement from '../repair/TechnicianEarningSettlement';
import TechnicianSettlementSummary from '../repair/TechnicianSettlementSummary';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import { NextStepPanel } from '../workspace/NextStepPanel';
import { StageSection } from '../workspace/StageSection';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getHandoverState } from '../../utils/repairStage';
import { getStatusRank } from '../../utils/workspacePresentation';
import { isPickupMissed, isNewPickupTimeRequested, formatPickupSlot } from '../../utils/pickupSlots';
import { formatRelativeTime } from '../../utils/relativeTime';
import { MissedPickupActions } from './MissedPickupActions';
import { staggerContainer, staggerItem } from '../../theme/motion';

const QUOTE_META = { submitted: 'Waiting for the customer', approved: 'Approved by the customer', rejected: 'Declined by the customer' };

// The admin's top panel. Only one state has an admin action - assigning a
// technician; everything else says plainly where the repair is and who it is
// waiting on. (The old "record settlement" state was retired in Phase 9:
// settlements are automatic and payouts go through Withdrawals.)
function nextStepModel(request) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const presentation = getStatusPresentation(status);
    // Missed pickup (missed-pickup phase): the technician's window ended
    // without the device being collected.
    if (isNewPickupTimeRequested(request)) {
        return {
            tone: 'waiting', eyebrow: 'Waiting for the customer', title: 'Customer asked for a new pickup time',
            description: `Asked ${formatRelativeTime(request.pickupRescheduleRequestedAt)}. ${request.technicianName || 'The technician'} stays on the job; the request updates when the customer chooses a time.`,
        };
    }
    if (isPickupMissed(request)) {
        const slot = formatPickupSlot(request.pickupSlot);
        return {
            tone: 'action', eyebrow: 'Needs you', title: 'Pickup missed', missed: true,
            description: `${request.technicianName || 'The technician'} did not collect the device${slot ? ` in its window (${slot})` : ''}. Give the job to someone else, or keep them and ask the customer for a new time.`,
        };
    }
    if (status === 'pending-pickup') {
        return { tone: 'action', eyebrow: 'Needs you', title: 'Assign a technician', description: 'This request is waiting for an eligible technician. Sarabo lists only the technicians it matches.', assign: true };
    }
    if (status === 'repair_completed' || status === 'parcel_delivered') {
        return { tone: 'done', eyebrow: 'Done', title: presentation.label, description: presentation.customerDescription };
    }
    if (status === 'cancelled' || status === 'quote_rejected') {
        return {
            tone: 'closed',
            eyebrow: 'No admin action',
            title: presentation.label,
            description: status === 'quote_rejected' ? 'The customer declined the quote. The technician can revise it or close the job.' : presentation.customerDescription,
        };
    }
    return { tone: 'waiting', eyebrow: 'No admin action', title: presentation.label, description: presentation.technicianDescription || presentation.customerDescription };
}

// Admin composition of the shared repair workspace (Phase 5): the same
// tracker, next-step panel, collapsible stage sections and side column the
// customer and technician see, all read-only. Every section keeps its own
// data and read rules; the server re-authorises everything. The separate
// lifecycle timeline is gone - it listed the same steps as the tracker,
// without dates.
function AdminRequestDetailsView({ request, sections, isV2Request }) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const rank = getStatusRank(status);
    const cancelled = status === 'cancelled';
    const handover = getHandoverState(request);
    const model = nextStepModel(request);

    return (
        <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
            <Motion.div variants={staggerItem}>
                <Card>
                    <CardContent className="p-5 sm:p-6">
                        <ServiceSpine request={request} />
                    </CardContent>
                </Card>
            </Motion.div>

            <Motion.div variants={staggerItem} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="min-w-0 space-y-4">
                    <NextStepPanel tone={model.tone} eyebrow={model.eyebrow} title={model.title} description={model.description}>
                        {model.missed && <MissedPickupActions request={request} />}
                        {model.assign && (
                            <Link to={`/dashboard/assign-technicians?request=${request._id}`} className={buttonVariants({ variant: 'action', size: 'lg' })}>
                                <UserCog aria-hidden="true" /> Find technicians
                            </Link>
                        )}
                    </NextStepPanel>

                    {isV2Request && sections.showDamage && (
                        <StageSection id="admin-request" title="Customer's request" meta={request.damage?.description || 'Device details and photos'} state="done" defaultOpen={rank <= 4}>
                            <DamageImageManager requestId={request._id} canEdit={false} />
                        </StageSection>
                    )}
                    {sections.showInspection && (cancelled || rank >= 5) && (
                        <StageSection id="admin-inspection" title="Inspection" meta="The technician's findings" state="done" defaultOpen={rank === 5}>
                            <InspectionSection requestId={request._id} canInspect={false} isAssignedTechnicianView={false} />
                        </StageSection>
                    )}
                    {sections.showQuote && (cancelled || rank >= 6) && (
                        <StageSection id="admin-quote" title="Quote and payment" meta={QUOTE_META[request.quote?.status] || 'Repair quote'} state={request.quote?.status === 'rejected' ? 'info' : 'done'} defaultOpen={rank === 6 || rank === 7}>
                            <QuoteSection requestId={request._id} isOwner={false} canSubmitQuote={false} isAssignedTechnicianView={false} />
                        </StageSection>
                    )}
                    {sections.showRepair && (
                        <StageSection id="admin-repair" title="Repair" meta={getStatusPresentation(status).technicianDescription} state={rank >= 10 ? 'done' : 'current'} defaultOpen={rank === 8 || rank === 9}>
                            <RepairSection requestId={request._id} canManage={false} deliveryStatus={status} />
                        </StageSection>
                    )}
                    {handover && (
                        <StageSection id="admin-handover" title="Handover" meta={handover.label} state={handover.confirmed ? 'done' : 'current'}>
                            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner={false} />
                        </StageSection>
                    )}
                    {request.technicianSettlement && (
                        <StageSection id="admin-settlement" title="Technician earnings" meta="Commission and what the technician receives" state="info">
                            <TechnicianSettlementSummary settlement={request.technicianSettlement} />
                        </StageSection>
                    )}
                    {/* Shown for any repair with a legacy earning, paid or not:
                        it is a historical record an admin may be asked about. */}
                    {request.technicianEarning && (
                        <StageSection id="admin-legacy-settlement" title="Technician settlement (earlier system)" meta="Internal accounting record" state="info">
                            <TechnicianEarningSettlement earning={request.technicianEarning} />
                        </StageSection>
                    )}
                    {!isV2Request && (
                        <StageSection id="admin-legacy" title="Earlier request" meta="Created before quotes and inspections" defaultOpen>
                            <p className="text-body-sm text-ds-muted-foreground">
                                This request uses the earlier workflow, so it has no inspection, quote or repair records.
                            </p>
                            {sections.showDamage && <div className="mt-4"><DamageImageManager requestId={request._id} canEdit={false} /></div>}
                        </StageSection>
                    )}
                </div>

                <aside aria-label="Request details" className="space-y-4 lg:sticky lg:top-24">
                    <WorkspaceContextPanels request={request} showCustomer />
                </aside>
            </Motion.div>
        </Motion.div>
    );
}

export { AdminRequestDetailsView };
