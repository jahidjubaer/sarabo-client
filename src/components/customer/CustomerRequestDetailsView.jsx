import { useState } from 'react';
import { motion as Motion } from 'motion/react';
import { Link } from 'react-router';
import { Camera, CalendarClock, RotateCcw } from 'lucide-react';
import { buttonVariants } from '../ui/button-variants';
import { canRebook, rebookPath } from '../../utils/createRequestFlow';
import ServiceSpine from '../spine/ServiceSpine';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import V2PaymentSection from '../payment/V2PaymentSection';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import CustomerTechnicianFeedback from '../feedback/customer/CustomerTechnicianFeedback';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import { PickupRescheduleSheet } from '../pickup/PickupRescheduleSheet';
import { Button } from '../ui/button';
import { canChangePickup } from '../../utils/pickupSlots';
import { NextStepPanel } from '../workspace/NextStepPanel';
import { StageSection } from '../workspace/StageSection';
import { Card, CardContent } from '../ui/card';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getRequestAction, getRequestGroup, isRequestPaid } from '../../utils/customerRequestPresentation';
import { getHandoverState } from '../../utils/repairStage';
import { staggerContainer, staggerItem } from '../../theme/motion';
import { getStatusRank } from '../../utils/workspacePresentation';

const QUOTE_META = { submitted: 'Waiting for your decision', approved: 'Approved', rejected: 'Declined' };

// The top panel: the action itself when the customer has one, otherwise a
// plain statement of where the repair is and who it is waiting on.
function nextStepModel(request, action) {
    const presentation = getStatusPresentation(request?.deliveryStatus);
    const group = getRequestGroup(request);
    const handover = getHandoverState(request);

    if (action?.kind === 'add-photo') {
        return { tone: 'action', eyebrow: 'Your next step', title: 'Add at least one photo', description: 'Technicians use photos to estimate the repair. Add a photo of the problem so they can see your request.' };
    }
    if (action?.kind === 'new-pickup-time') {
        return { tone: 'action', eyebrow: 'Your next step', title: 'Choose a new pickup time', description: 'Your pickup was missed. Choose a new 2-hour window and your technician will collect the device then.' };
    }
    if (action?.kind === 'quote-review') {
        return { tone: 'action', eyebrow: 'Your next step', title: 'Review and decide on your quote', description: 'Your technician has inspected the device. Approve to go ahead, or decline.' };
    }
    if (action?.kind === 'payment') {
        return { tone: 'action', eyebrow: 'Your next step', title: 'Pay to start the repair', description: 'You approved the quote. The repair starts once payment is confirmed.' };
    }
    if (action?.kind === 'handover') {
        return { tone: 'action', eyebrow: 'Your next step', title: 'Confirm you have your device', description: 'Your repair is complete. Confirm once the device is back in your hands.' };
    }
    if (group === 'completed') {
        return { tone: 'done', eyebrow: 'Done', title: handover?.confirmed ? 'Device received' : presentation.label, description: handover?.confirmed ? 'Thanks for confirming. You can review your technician below.' : presentation.customerDescription };
    }
    if (group === 'closed') {
        return { tone: 'closed', eyebrow: 'Closed', title: presentation.label, description: presentation.customerDescription };
    }
    return { tone: 'waiting', eyebrow: 'Nothing needed from you', title: presentation.label, description: presentation.customerDescription };
}

// Customer composition of the shared repair workspace (Phase 3).
//
//   tracker          the four stages, once
//   next step        the live control (quote decision / payment / receipt)
//                    or a plain status line
//   stage sections   in the order they happened, each collapsible; a stage
//                    appears only once reached, past ones start collapsed
//   side column      device, service and money details
//
// Every section component still owns its data, validation and mutation; the
// server re-authorises everything. Only placement and framing changed.
function CustomerRequestDetailsView({ request, sections, isV2Request, damageImagesEditable }) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const rank = getStatusRank(status);
    const cancelled = status === 'cancelled';
    const action = getRequestAction(request);
    const [pickupSheetOpen, setPickupSheetOpen] = useState(false);
    const pickupAction = canChangePickup(request) ? (
        <Button variant="outline" size="sm" onClick={() => setPickupSheetOpen(true)}>
            {request.pickupSlot ? 'Change' : 'Choose time'}
        </Button>
    ) : null;
    const model = nextStepModel(request, action);
    const handover = getHandoverState(request);
    const paid = isRequestPaid(request);
    const focus = action?.kind; // quote-review | payment | handover | undefined

    const show = {
        request: isV2Request,
        inspection: sections.showInspection && (cancelled || rank >= 5),
        quote: sections.showQuote && (cancelled || rank >= 6) && focus !== 'quote-review',
        payment: sections.showPayment && rank >= 7 && focus !== 'payment',
        repair: sections.showRepair,
        handover: rank >= 10 && focus !== 'handover',
        feedback: isV2Request,
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

            <Motion.div variants={staggerItem} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="min-w-0 space-y-4">
                    <NextStepPanel tone={model.tone} eyebrow={model.eyebrow} title={model.title} description={model.description}>
                        {focus === 'quote-review' && (
                            <QuoteSection requestId={request._id} isOwner canSubmitQuote={false} isAssignedTechnicianView={false} />
                        )}
                        {focus === 'payment' && <V2PaymentSection requestId={request._id} bare />}
                        {focus === 'handover' && <ReceiptConfirmationSection requestId={request._id} request={request} isOwner />}
                        {focus === 'add-photo' && (
                            <a href="#repair-request" className={buttonVariants({ variant: 'action' })}>
                                <Camera aria-hidden="true" /> Add a photo
                            </a>
                        )}
                        {focus === 'new-pickup-time' && (
                            <Button variant="action" onClick={() => setPickupSheetOpen(true)}>
                                <CalendarClock aria-hidden="true" /> Choose a new time
                            </Button>
                        )}
                        {canRebook(request) && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                <Link to={rebookPath(request)} className={buttonVariants({ variant: 'primary' })}>
                                    <RotateCcw aria-hidden="true" /> Request again
                                </Link>
                                <p className="text-body-sm text-ds-muted-foreground">Opens a new request with this device, repair and address filled in.</p>
                            </div>
                        )}
                    </NextStepPanel>

                    {show.request && (
                        <StageSection
                            id="repair-request"
                            title="Your request"
                            meta={request.damage?.description || 'Device details and photos'}
                            state={rank >= 5 ? 'done' : 'current'}
                            defaultOpen={rank <= 4 && damageImagesEditable}
                        >
                            {sections.showDamage && <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />}
                        </StageSection>
                    )}

                    {show.inspection && (
                        <StageSection
                            id="repair-inspection"
                            title="Inspection"
                            meta={rank >= 5 ? 'Findings from your technician' : 'Not inspected'}
                            state={rank >= 5 ? 'done' : 'info'}
                            // Open when the quote is waiting, so the findings that
                            // justify the price are right there.
                            defaultOpen={focus === 'quote-review' || rank === 5}
                        >
                            <InspectionSection requestId={request._id} canInspect={false} isAssignedTechnicianView={false} />
                        </StageSection>
                    )}

                    {show.quote && (
                        <StageSection
                            id="repair-quote"
                            title="Quote"
                            meta={QUOTE_META[request.quote?.status] || 'Repair quote'}
                            state={request.quote?.status === 'rejected' ? 'info' : 'done'}
                            defaultOpen={status === 'quote_rejected'}
                        >
                            <QuoteSection requestId={request._id} isOwner canSubmitQuote={false} isAssignedTechnicianView={false} />
                        </StageSection>
                    )}

                    {show.payment && (
                        <StageSection id="repair-payment" title="Payment" meta={paid ? 'Paid' : 'Due'} state={paid ? 'done' : 'current'}>
                            <V2PaymentSection requestId={request._id} bare />
                        </StageSection>
                    )}

                    {show.repair && (
                        <StageSection
                            id="repair-work"
                            title="Repair"
                            meta={getStatusPresentation(status).customerDescription}
                            state={rank >= 10 ? 'done' : 'current'}
                            defaultOpen={rank === 8 || rank === 9}
                        >
                            <RepairSection requestId={request._id} canManage={false} deliveryStatus={status} />
                        </StageSection>
                    )}

                    {show.handover && (
                        <StageSection id="repair-handover" title="Handover" meta={handover?.label || 'Device handover'} state={handover?.confirmed ? 'done' : 'current'}>
                            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner />
                        </StageSection>
                    )}

                    {show.feedback && (
                        <StageSection
                            id="repair-feedback"
                            title="Review or report your technician"
                            meta="Share how the repair went, or raise a concern"
                            defaultOpen={rank >= 10}
                        >
                            <CustomerTechnicianFeedback requestId={request._id} />
                        </StageSection>
                    )}

                    {!isV2Request && (
                        <StageSection id="repair-legacy" title="Earlier request" meta="Created before quotes and inspections" defaultOpen>
                            <p className="text-body-sm text-ds-muted-foreground">
                                This request was made before the current repair workflow, so it has no inspection or quote.
                            </p>
                        </StageSection>
                    )}
                </div>

                <aside aria-label="Repair details" className="space-y-4 lg:sticky lg:top-24">
                    <WorkspaceContextPanels request={request} showCustomer={false} pickupAction={pickupAction} />
                </aside>
                <PickupRescheduleSheet open={pickupSheetOpen} onOpenChange={setPickupSheetOpen} request={request} />
            </Motion.div>
        </Motion.div>
    );
}

export { CustomerRequestDetailsView };
