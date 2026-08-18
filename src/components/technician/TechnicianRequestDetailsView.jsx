import { motion as Motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import ServiceSpine from '../spine/ServiceSpine';
import { CurrentStageActionPanel } from '../workspace/CurrentStageActionPanel';
import { RepairLifecycleTimeline } from '../workspace/RepairLifecycleTimeline';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import QuoteRejectedActions from '../quote/QuoteRejectedActions';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import { getTechnicianAttention } from '../../utils/technicianJobPresentation';
import { getHandoverState } from '../../utils/repairStage';
import { staggerContainer, staggerItem } from '../../theme/motion';

function SectionCard({ id, eyebrow, title, children }) {
    return (
        <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
            <Card>
                <CardContent className="space-y-4 p-5 sm:p-6">
                    {eyebrow && <p className="ds-label text-ds-primary">{eyebrow}</p>}
                    <h2 id={`${id}-heading`} className="text-base font-semibold text-ds-foreground">{title}</h2>
                    {children}
                </CardContent>
            </Card>
        </section>
    );
}

// Technician-only composition for shared RequestDetails. All nested query and
// mutation owners remain unchanged; this component changes source order and
// visual emphasis only.
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
    const attention = getTechnicianAttention(request);
    const handover = getHandoverState(request);
    const actionTarget = canInspect
        ? '#technician-inspection'
        : canSubmitQuote
            ? '#technician-quote'
            : (attention.kind === 'action' && sections.showRepair ? '#technician-repair' : null);
    const actionLabel = actionTarget ? attention.action?.label : null;

    return (
        <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <Motion.div variants={staggerItem}>
                <CurrentStageActionPanel
                    request={request}
                    viewerRole="technician"
                    isAssignedTechnicianView={technicianCanAdvance}
                    onAdvance={onAdvance}
                    advancing={advancing}
                    onAccept={onAccept}
                    onReject={onReject}
                    deciding={deciding}
                    featured
                    actionTarget={actionTarget}
                    actionLabel={actionLabel}
                />
            </Motion.div>

            <Motion.div variants={staggerItem}>
                <Card>
                    <CardContent className="space-y-4 p-5 sm:p-6">
                        <div>
                            <p className="ds-label text-ds-primary">Service spine</p>
                            <h2 className="mt-1 text-base font-semibold text-ds-foreground">Repair lifecycle</h2>
                        </div>
                        <ServiceSpine request={request} />
                        {handover && (
                            <div className="border-t border-ds-border pt-4">
                                <p className="ds-label text-ds-muted-foreground">Customer handover</p>
                                <p className="mt-0.5 text-sm font-medium text-ds-foreground">{handover.label}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Motion.div>

            {/* Phase 9.2: the only route out of a declined quote. Shown to the
                assigned technician only, and only while the request is actually
                at quote_rejected - the server re-checks both. Placed directly
                under the spine so it reads as the current task, the same
                position the stage action panel occupies at other stages. */}
            {isAssignedTechnicianView && request.deliveryStatus === 'quote_rejected' && (
                <Motion.div variants={staggerItem}>
                    <QuoteRejectedActions requestId={request._id} />
                </Motion.div>
            )}

            <Motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3 lg:items-start">
                <div className="space-y-6 lg:col-span-2">
                    {sections.showInspection && (
                        <SectionCard id="technician-inspection" eyebrow={canInspect ? 'Current task' : undefined} title="Inspection">
                            <InspectionSection
                                requestId={request._id}
                                canInspect={canInspect}
                                isAssignedTechnicianView={isAssignedTechnicianView}
                            />
                        </SectionCard>
                    )}

                    {sections.showQuote && (
                        <SectionCard id="technician-quote" eyebrow={canSubmitQuote ? 'Current task' : undefined} title="Repair quote">
                            <QuoteSection
                                requestId={request._id}
                                isOwner={false}
                                canSubmitQuote={canSubmitQuote}
                                isAssignedTechnicianView={isAssignedTechnicianView}
                            />
                        </SectionCard>
                    )}

                    {sections.showRepair && (
                        <SectionCard id="technician-repair" eyebrow={actionTarget === '#technician-repair' ? 'Current task' : undefined} title="Repair work">
                            <RepairSection
                                requestId={request._id}
                                canManage={isAssignedTechnicianView}
                                deliveryStatus={request.deliveryStatus}
                            />
                        </SectionCard>
                    )}

                    {handover && (
                        <SectionCard id="technician-handover" title="Customer handover">
                            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner={false} />
                        </SectionCard>
                    )}

                    {sections.showDamage && (
                        <SectionCard id="technician-damage" title="Damage photos">
                            <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />
                        </SectionCard>
                    )}

                    {!isV2Request && (
                        <SectionCard id="technician-legacy" title="Repair request">
                            <p className="text-sm text-ds-muted-foreground">
                                This is an earlier repair request. Inspection, quotes, and the newer repair workflow are available for requests created after the latest update.
                            </p>
                        </SectionCard>
                    )}
                </div>

                <aside aria-labelledby="technician-job-context-heading" className="space-y-4 lg:sticky lg:top-24">
                    <div>
                        <p className="ds-label text-ds-primary">Operational context</p>
                        <h2 id="technician-job-context-heading" className="mt-1 text-base font-semibold text-ds-foreground">Job details</h2>
                    </div>
                    <WorkspaceContextPanels request={request} showCustomer />
                    <RepairLifecycleTimeline request={request} />
                </aside>
            </Motion.div>
        </Motion.div>
    );
}

export { TechnicianRequestDetailsView };
