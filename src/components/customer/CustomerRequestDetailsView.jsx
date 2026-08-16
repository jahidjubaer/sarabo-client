import { motion as Motion } from 'motion/react';
import { ArrowDown, CircleAlert, CircleCheckBig, CircleX, Clock3 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import ServiceSpine from '../spine/ServiceSpine';
import DamageImageManager from '../damage-images/DamageImageManager';
import InspectionSection from '../inspection/InspectionSection';
import QuoteSection from '../quote/QuoteSection';
import V2PaymentSection from '../payment/V2PaymentSection';
import RepairSection from '../repair/RepairSection';
import ReceiptConfirmationSection from '../repair/ReceiptConfirmationSection';
import { WorkspaceContextPanels } from '../workspace/WorkspaceContextPanels';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getRequestAction, getRequestGroup } from '../../utils/customerRequestPresentation';
import { getHandoverState } from '../../utils/repairStage';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { staggerContainer, staggerItem } from '../../theme/motion';
import { cn } from '../../lib/utils';

const ATTENTION_TONES = {
    action: { wrap: 'border-ds-warning/40 bg-ds-warning/5', icon: 'bg-ds-warning/15 text-ds-warning', Icon: CircleAlert },
    waiting: { wrap: 'border-ds-primary/25 bg-ds-primary/5', icon: 'bg-ds-primary/10 text-ds-primary', Icon: Clock3 },
    done: { wrap: 'border-ds-success/30 bg-ds-success/5', icon: 'bg-ds-success/10 text-ds-success', Icon: CircleCheckBig },
    terminal: { wrap: 'border-ds-border bg-ds-muted/30', icon: 'bg-ds-muted text-ds-muted-foreground', Icon: CircleX },
};

function attentionModel(request) {
    const presentation = getStatusPresentation(request?.deliveryStatus);
    const action = getRequestAction(request);
    const group = getRequestGroup(request);
    const handover = getHandoverState(request);

    if (action) {
        return {
            tone: 'action',
            eyebrow: 'Action required',
            title: action.label,
            description: action.kind === 'handover'
                ? 'Your repair is complete. Confirm once your repaired device is back in your hands.'
                : presentation.customerNextStep,
            action,
        };
    }
    if (group === 'completed') {
        return {
            tone: 'done',
            eyebrow: 'Repair update',
            title: handover?.confirmed ? 'Device received' : presentation.label,
            description: handover?.confirmed ? 'Your device handover has been confirmed.' : presentation.customerDescription,
            action: null,
        };
    }
    if (group === 'closed') {
        return {
            tone: 'terminal',
            eyebrow: 'Request update',
            title: presentation.label,
            description: presentation.customerDescription,
            action: null,
        };
    }
    return {
        tone: 'waiting',
        eyebrow: 'No action required',
        title: presentation.label,
        description: presentation.customerDescription,
        action: null,
    };
}

function AttentionPanel({ request }) {
    const model = attentionModel(request);
    const tone = ATTENTION_TONES[model.tone];
    const Icon = tone.Icon;
    const target = model.action?.kind === 'quote-review'
        ? '#repair-quote'
        : model.action?.kind === 'handover'
            ? '#repair-handover'
            : null;

    return (
        <section aria-labelledby="customer-next-action-heading" className={cn('rounded-ds-lg border p-5 sm:p-6', tone.wrap)}>
            <div className="flex items-start gap-3">
                <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full', tone.icon)}>
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="ds-label text-ds-muted-foreground">{model.eyebrow}</p>
                    <h2 id="customer-next-action-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">{model.title}</h2>
                    {model.description && <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">{model.description}</p>}
                    {target && (
                        <a href={target} className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}>
                            {model.action.label}
                            <ArrowDown aria-hidden="true" />
                        </a>
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

// Customer-only composition for the shared RequestDetails route. All reads,
// mutations, visibility flags, and nested section components remain the same;
// only their Customer source order and hierarchy change.
function CustomerRequestDetailsView({ request, sections, isV2Request, damageImagesEditable }) {
    const action = getRequestAction(request);
    const handover = getHandoverState(request);
    const quoteIsFocused = action?.kind === 'quote-review';
    const paymentIsFocused = action?.kind === 'payment';
    const handoverIsFocused = action?.kind === 'handover';

    const quoteSection = sections.showQuote ? (
        <SectionCard id="repair-quote" eyebrow={quoteIsFocused ? 'Your decision' : undefined} title={quoteIsFocused ? 'Review repair quote' : 'Repair quote'}>
            <QuoteSection requestId={request._id} isOwner canSubmitQuote={false} isAssignedTechnicianView={false} />
        </SectionCard>
    ) : null;

    const paymentSection = sections.showPayment ? (
        <div id="repair-payment" className="scroll-mt-24">
            <V2PaymentSection requestId={request._id} />
        </div>
    ) : null;

    const handoverSection = (
        <SectionCard id="repair-handover" eyebrow={handoverIsFocused ? 'Handover' : undefined} title="Device handover">
            <ReceiptConfirmationSection requestId={request._id} request={request} isOwner />
        </SectionCard>
    );

    return (
        <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <Motion.div variants={staggerItem}>
                <AttentionPanel request={request} />
            </Motion.div>

            {quoteIsFocused && <Motion.div variants={staggerItem}>{quoteSection}</Motion.div>}
            {paymentIsFocused && <Motion.div variants={staggerItem}>{paymentSection}</Motion.div>}
            {handoverIsFocused && <Motion.div variants={staggerItem}>{handoverSection}</Motion.div>}

            <Motion.div variants={staggerItem}>
                <Card>
                    <CardContent className="space-y-4 p-5 sm:p-6">
                        <div>
                            <p className="ds-label text-ds-primary">Service spine</p>
                            <h2 className="mt-1 text-base font-semibold text-ds-foreground">Repair lifecycle</h2>
                        </div>
                        <ServiceSpine request={request} />
                        {handover && (
                            <div className="flex flex-col gap-1 border-t border-ds-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="ds-label text-ds-muted-foreground">Device handover</p>
                                    <p className="mt-0.5 text-sm font-medium text-ds-foreground">{handover.label}</p>
                                </div>
                                {handover.confirmedAt && <p className="text-xs text-ds-muted-foreground">Confirmed {formatAbsoluteDateTime(handover.confirmedAt)}</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Motion.div>

            <Motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3 lg:items-start">
                <div className="space-y-6 lg:col-span-2">
                    {sections.showInspection && (
                        <SectionCard id="repair-inspection" title="Inspection">
                            <InspectionSection requestId={request._id} canInspect={false} isAssignedTechnicianView={false} />
                        </SectionCard>
                    )}
                    {!quoteIsFocused && quoteSection}
                    {!paymentIsFocused && paymentSection}
                    {sections.showRepair && (
                        <SectionCard id="repair-work" title="Repair">
                            <RepairSection requestId={request._id} canManage={false} deliveryStatus={request.deliveryStatus} />
                        </SectionCard>
                    )}
                    {!handoverIsFocused && handover && handoverSection}
                    {sections.showDamage && (
                        <SectionCard id="repair-photos" title="Damage photos">
                            <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />
                        </SectionCard>
                    )}
                    {!isV2Request && (
                        <SectionCard id="repair-legacy" title="Repair request">
                            <p className="text-sm text-ds-muted-foreground">
                                This is an earlier repair request. Inspection, quotes, and the newer repair workflow are available for requests created after the latest update.
                            </p>
                        </SectionCard>
                    )}
                </div>

                <aside aria-labelledby="customer-request-context-heading" className="space-y-3 lg:sticky lg:top-24">
                    <div>
                        <p className="ds-label text-ds-primary">Supporting information</p>
                        <h2 id="customer-request-context-heading" className="mt-1 text-base font-semibold text-ds-foreground">Request details</h2>
                    </div>
                    <WorkspaceContextPanels request={request} showCustomer={false} />
                </aside>
            </Motion.div>
        </Motion.div>
    );
}

export { CustomerRequestDetailsView };
