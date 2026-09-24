import { motion as Motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';
import ServiceSpine from '../spine/ServiceSpine';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import { NextStepPanel } from '../workspace/NextStepPanel';
import { StageSection } from '../workspace/StageSection';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import QuoteRejectedActions from '../quote/QuoteRejectedActions';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import TechnicianSettlementSummary from '../repair/TechnicianSettlementSummary';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getTechnicianAdvance, getStatusRank } from '../../utils/workspacePresentation';
import { isAssignmentDecisionPending } from '../../utils/assignmentDecision';
import { getHandoverState } from '../../utils/repairStage';
import { staggerContainer, staggerItem } from '../../theme/motion';

const QUOTE_META = { submitted: 'Waiting for the customer', approved: 'Approved by the customer', rejected: 'Declined by the customer' };

// What the technician's next-step panel holds: which live control, and the
// words around it. `focus` names the section that moves into the panel.
function nextStepModel({ request, decisionPending, isAssignedTechnicianView, canInspect, canSubmitQuote, advance }) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const presentation = getStatusPresentation(status);
    if (decisionPending) return { focus: 'offer', tone: 'action', eyebrow: 'New job offer', title: 'Accept or decline this job', description: 'Check the device, the fault and the location, then decide.' };
    if (advance) return { focus: 'advance', tone: 'action', eyebrow: 'Your next step', title: advance.label, description: presentation.technicianNextStep };
    if (canInspect) return { focus: 'inspection', tone: 'action', eyebrow: 'Your next step', title: 'Inspect the device', description: 'Record what you found. The customer sees your findings next to the quote.' };
    if (canSubmitQuote) return { focus: 'quote', tone: 'action', eyebrow: 'Your next step', title: 'Write the quote', description: 'Itemise labour, parts and anything extra. The customer approves it before any work starts.' };
    if (status === 'quote_rejected' && isAssignedTechnicianView) return { focus: 'declined', tone: 'action', eyebrow: 'Your next step', title: 'Revise the quote or close the job', description: 'The customer declined your quote.' };
    if (isAssignedTechnicianView && (status === 'payment_completed' || status === 'repair_in_progress')) {
        return { focus: 'repair', tone: 'action', eyebrow: status === 'payment_completed' ? 'Your next step' : 'In repair', title: status === 'payment_completed' ? 'Start the repair' : 'Post updates and finish the repair', description: 'The customer has paid.' };
    }
    if (status === 'repair_completed' || status === 'parcel_delivered') return { focus: null, tone: 'done', eyebrow: 'Done', title: presentation.label, description: presentation.technicianDescription };
    if (status === 'cancelled') return { focus: null, tone: 'closed', eyebrow: 'Closed', title: presentation.label, description: presentation.technicianDescription };
    return { focus: null, tone: 'waiting', eyebrow: 'Waiting', title: presentation.label, description: presentation.technicianNextStep || presentation.technicianDescription };
}

// Technician composition of the shared repair workspace (Phase 4).
//
//   tracker        the four stages, once
//   next step      the live work: accept/decline the offer, the early status
//                  step, the inspection form, the quote form, revise/close a
//                  declined quote, or repair updates and completion
//   job details    customer contact and address - directly under the next step
//                  on phones, in the side column on desktop
//   stages         in the order they happened, each collapsible, only once
//                  reached
//
// All mutations still belong to RequestDetails (status advance, accept, decline)
// and to each section component (inspection, quote, repair); the server
// re-authorises everything. The separate nine-step lifecycle timeline is gone -
// it repeated the tracker.
function TechnicianRequestDetailsView({
    request,
    sections,
    isV2Request,
    damageImagesEditable,
    isAssignedTechnicianView,
    technicianCanAdvance,
    canInspect,
    canSubmitQuote,
    onAdvance,
    advancing,
    onAccept,
    onReject,
    deciding,
}) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const rank = getStatusRank(status);
    const cancelled = status === 'cancelled';
    const handover = getHandoverState(request);
    const decisionPending = technicianCanAdvance && isAssignmentDecisionPending(request);
    const advance = technicianCanAdvance && !decisionPending ? getTechnicianAdvance({ request }) : null;
    const model = nextStepModel({
        request,
        decisionPending,
        isAssignedTechnicianView,
        canInspect,
        canSubmitQuote,
        advance,
    });
    const focus = model.focus;

    const show = {
        request: isV2Request,
        inspection: sections.showInspection && (cancelled || rank >= 5) && focus !== 'inspection',
        quote: sections.showQuote && (cancelled || rank >= 6) && focus !== 'quote',
        repair: sections.showRepair && focus !== 'repair',
        handover: Boolean(handover),
        settlement: Boolean(request.technicianSettlement),
    };

    return (
        <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
            <Motion.div variants={staggerItem}>
                <Card>
                    <CardContent className="p-5 sm:p-6">
                        <ServiceSpine request={request} />
                    </CardContent>
                </Card>
            </Motion.div>

            {/* DOM order is next step, job details, stages - so on a phone the
                customer's contact sits right under the task. From lg the details
                move to the side column. */}
            <Motion.div variants={staggerItem} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                    <NextStepPanel tone={model.tone} eyebrow={model.eyebrow} title={model.title} description={model.description}>
                        {focus === 'offer' && (
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <LoadingButton variant="action" size="lg" onClick={onAccept} loading={deciding} loadingText="Accepting…">Accept job</LoadingButton>
                                <Button variant="outline" size="lg" onClick={onReject} disabled={deciding}>Decline</Button>
                            </div>
                        )}
                        {focus === 'advance' && (
                            <LoadingButton variant="action" size="lg" onClick={() => onAdvance(advance.nextStatus)} loading={advancing} loadingText="Updating…">
                                {advance.label}
                            </LoadingButton>
                        )}
                        {focus === 'inspection' && <InspectionSection requestId={request._id} canInspect isAssignedTechnicianView={isAssignedTechnicianView} />}
                        {focus === 'quote' && <QuoteSection requestId={request._id} isOwner={false} canSubmitQuote isAssignedTechnicianView={isAssignedTechnicianView} />}
                        {focus === 'declined' && <QuoteRejectedActions requestId={request._id} />}
                        {focus === 'repair' && <RepairSection requestId={request._id} canManage deliveryStatus={status} />}
                    </NextStepPanel>
                </div>

                <aside aria-label="Job details" className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                    <WorkspaceContextPanels request={request} showCustomer />
                </aside>

                <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">
                    {show.request && (
                        <StageSection id="technician-request" title="Customer's request" meta={request.damage?.description || 'Device details and photos'} state="done" defaultOpen={rank <= 5}>
                            {sections.showDamage && <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />}
                        </StageSection>
                    )}
                    {show.inspection && (
                        <StageSection id="technician-inspection" title="Inspection" meta="Your findings" state="done" defaultOpen={focus === 'quote'}>
                            <InspectionSection requestId={request._id} canInspect={false} isAssignedTechnicianView={isAssignedTechnicianView} />
                        </StageSection>
                    )}
                    {show.quote && (
                        <StageSection id="technician-quote" title="Quote" meta={QUOTE_META[request.quote?.status] || 'Repair quote'} state={request.quote?.status === 'rejected' ? 'info' : 'done'} defaultOpen={focus === 'declined'}>
                            <QuoteSection requestId={request._id} isOwner={false} canSubmitQuote={false} isAssignedTechnicianView={isAssignedTechnicianView} />
                        </StageSection>
                    )}
                    {show.repair && (
                        <StageSection id="technician-repair" title="Repair" meta={getStatusPresentation(status).technicianDescription} state={rank >= 10 ? 'done' : 'current'}>
                            <RepairSection requestId={request._id} canManage={isAssignedTechnicianView} deliveryStatus={status} />
                        </StageSection>
                    )}
                    {show.handover && (
                        <StageSection id="technician-handover" title="Handover" meta={handover.label} state={handover.confirmed ? 'done' : 'current'}>
                            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner={false} />
                        </StageSection>
                    )}
                    {show.settlement && (
                        <StageSection id="technician-settlement" title="Your earnings" meta="What this repair adds to your wallet" state="info" defaultOpen={rank >= 10}>
                            <TechnicianSettlementSummary settlement={request.technicianSettlement} />
                        </StageSection>
                    )}
                    {!isV2Request && (
                        <StageSection id="technician-legacy" title="Earlier request" meta="Created before quotes and inspections" defaultOpen>
                            <p className="text-body-sm text-ds-muted-foreground">
                                This request was made before the current repair workflow, so it has no inspection or quote.
                            </p>
                        </StageSection>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

export { TechnicianRequestDetailsView };
