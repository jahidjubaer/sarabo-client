import { Link } from 'react-router';
import { motion as Motion } from 'motion/react';
import { CircleAlert, CircleCheckBig, CircleX, Clock3, UserCog } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import ServiceSpine from '../spine/ServiceSpine';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import TechnicianEarningSettlement from '../repair/TechnicianEarningSettlement';
import { RepairLifecycleTimeline } from '../workspace/RepairLifecycleTimeline';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getHandoverState } from '../../utils/repairStage';
import { staggerContainer, staggerItem } from '../../theme/motion';
import { cn } from '../../lib/utils';

const ATTENTION_STYLES = {
    action: { wrap: 'border-ds-warning/40 bg-ds-warning/5', icon: 'bg-ds-warning/15 text-ds-warning', Icon: CircleAlert },
    waiting: { wrap: 'border-ds-primary/25 bg-ds-primary/5', icon: 'bg-ds-primary/10 text-ds-primary', Icon: Clock3 },
    done: { wrap: 'border-ds-success/30 bg-ds-success/5', icon: 'bg-ds-success/10 text-ds-success', Icon: CircleCheckBig },
    terminal: { wrap: 'border-ds-border bg-ds-muted/30', icon: 'bg-ds-muted text-ds-muted-foreground', Icon: CircleX },
};

function getAdminAttention(request) {
    const presentation = getStatusPresentation(request?.deliveryStatus);
    const settlementPending = request?.deliveryStatus === 'repair_completed'
        && request?.technicianEarning
        && request.technicianEarning.status !== 'paid';

    if (request?.deliveryStatus === 'pending-pickup') {
        return {
            tone: 'action',
            eyebrow: 'Admin action required',
            title: 'Assign a Technician',
            description: 'This repair request is waiting for an eligible Technician assignment.',
            action: { kind: 'route', label: 'Find technicians', to: `/dashboard/assign-technicians?request=${request._id}`, Icon: UserCog },
        };
    }
    if (settlementPending) {
        return {
            tone: 'action',
            eyebrow: 'Admin action required',
            title: 'Record Technician settlement',
            description: 'Repair work is complete and the recorded Technician earning is still pending settlement.',
            action: { kind: 'settlement' },
        };
    }
    if (request?.deliveryStatus === 'cancelled' || request?.deliveryStatus === 'quote_rejected') {
        return {
            tone: 'terminal',
            eyebrow: 'Workflow update',
            title: presentation.label,
            description: request.deliveryStatus === 'quote_rejected' ? 'The Customer declined the repair quote. No Admin workflow action is available.' : presentation.customerDescription,
        };
    }
    if (request?.deliveryStatus === 'repair_completed' || request?.deliveryStatus === 'parcel_delivered') {
        return {
            tone: 'done',
            eyebrow: 'Workflow update',
            title: presentation.label,
            description: request?.technicianEarning?.status === 'paid'
                ? 'Repair work is complete and the recorded Technician earning is marked as paid.'
                : presentation.customerDescription,
        };
    }
    return {
        tone: 'waiting',
        eyebrow: 'Operational status',
        title: presentation.label,
        description: presentation.technicianDescription || presentation.customerDescription || 'No Admin action is available for this workflow state.',
    };
}

function AdminAttentionPanel({ request }) {
    const attention = getAdminAttention(request);
    const style = ATTENTION_STYLES[attention.tone];
    const Icon = style.Icon;
    const ActionIcon = attention.action?.Icon;
    const actionClassName = cn(buttonVariants({ variant: 'action', size: 'sm' }), 'mt-4 w-full sm:w-auto');

    return (
        <section aria-labelledby="admin-request-attention-heading" className={cn('rounded-ds-lg border p-5 sm:p-6', style.wrap)}>
            <div className="flex items-start gap-3">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', style.icon)}>
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="ds-label text-ds-muted-foreground">{attention.eyebrow}</p>
                    <h2 id="admin-request-attention-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">{attention.title}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">{attention.description}</p>
                    {attention.action?.kind === 'route' && (
                        <Link to={attention.action.to} className={actionClassName}>
                            <ActionIcon aria-hidden="true" /> {attention.action.label}
                        </Link>
                    )}
                    {attention.action?.kind === 'settlement' && (
                        <div className="mt-4">
                            <TechnicianEarningSettlement requestId={request._id} earning={request.technicianEarning} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

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

function AdminRequestDetailsView({ request, sections, isV2Request }) {
    const handover = getHandoverState(request);
    const settlementVisible = request.deliveryStatus === 'repair_completed' && request.technicianEarning;
    const settlementPending = settlementVisible && request.technicianEarning.status !== 'paid';

    return (
        <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <Motion.div variants={staggerItem}>
                <AdminAttentionPanel request={request} />
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

            <Motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3 lg:items-start">
                <div className="space-y-6 lg:col-span-2">
                    {sections.showInspection && (
                        <SectionCard id="admin-inspection" title="Inspection context">
                            <InspectionSection requestId={request._id} canInspect={false} isAssignedTechnicianView={false} />
                        </SectionCard>
                    )}

                    {sections.showQuote && (
                        <SectionCard id="admin-quote" title="Quote and payment context">
                            <QuoteSection requestId={request._id} isOwner={false} canSubmitQuote={false} isAssignedTechnicianView={false} />
                        </SectionCard>
                    )}

                    {sections.showRepair && (
                        <SectionCard id="admin-repair" title="Repair context">
                            <RepairSection requestId={request._id} canManage={false} deliveryStatus={request.deliveryStatus} />
                        </SectionCard>
                    )}

                    {handover && (
                        <SectionCard id="admin-handover" title="Customer handover">
                            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner={false} />
                        </SectionCard>
                    )}

                    {settlementVisible && !settlementPending && (
                        <SectionCard id="admin-settlement" eyebrow="Internal accounting" title="Technician settlement">
                            <TechnicianEarningSettlement requestId={request._id} earning={request.technicianEarning} />
                        </SectionCard>
                    )}

                    {sections.showDamage && (
                        <SectionCard id="admin-evidence" title="Damage and repair evidence">
                            <DamageImageManager requestId={request._id} canEdit={false} />
                        </SectionCard>
                    )}

                    {!isV2Request && (
                        <SectionCard id="admin-legacy" title="Repair request">
                            <p className="text-sm text-ds-muted-foreground">This earlier repair request uses the legacy workflow and does not include the newer inspection, quote, and repair records.</p>
                        </SectionCard>
                    )}
                </div>

                <aside aria-labelledby="admin-request-context-heading" className="space-y-4 lg:sticky lg:top-24">
                    <div>
                        <p className="ds-label text-ds-primary">Operational context</p>
                        <h2 id="admin-request-context-heading" className="mt-1 text-base font-semibold text-ds-foreground">Request and assignment details</h2>
                    </div>
                    <WorkspaceContextPanels request={request} showCustomer />
                    <RepairLifecycleTimeline request={request} />
                </aside>
            </Motion.div>
        </Motion.div>
    );
}

export { AdminRequestDetailsView };
