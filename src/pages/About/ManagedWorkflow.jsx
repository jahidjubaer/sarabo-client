import { ClipboardList, Search, UserCheck, Wrench, ReceiptText, CheckCircle2, Ban } from 'lucide-react';
import { getRepairStatusLabel } from '../../utils/repairStatus';

// Content unchanged from the reviewed version - all five workflow steps and
// both alternate outcomes preserved verbatim, including the careful note that
// cancellation is an alternate outcome rather than a guaranteed final step.
//
// Labels that correspond to a real stored status still reuse
// getRepairStatusLabel(); "Request reviewed", "Repair activity progresses" and
// "Payment recorded where applicable" remain narrative steps with no raw status
// equivalent, so none is invented here.
//
// Phase 5A absorbed the DarkTechSection wrapper: the ink band is now expressed
// directly in the service-spine ink tokens instead of the legacy
// surface-dark / on-dark / brand-accent palette.
const workflowSteps = [
    {
        icon: ClipboardList,
        label: getRepairStatusLabel('pending-pickup'),
        responsibility: 'A customer submits a repair request with the required device and issue details.',
    },
    {
        icon: Search,
        label: 'Request reviewed',
        responsibility: 'The request becomes available for administrative oversight before technician assignment.',
    },
    {
        icon: UserCheck,
        label: getRepairStatusLabel('driver_assigned'),
        responsibility: 'An approved technician is assigned to the request through a controlled administrative action.',
    },
    {
        icon: Wrench,
        label: 'Repair activity progresses',
        responsibility: 'The assigned technician updates the repair status as service work moves forward.',
    },
    {
        icon: ReceiptText,
        label: 'Payment recorded where applicable',
        responsibility: 'Supported payment confirmation is validated on the server and recorded against the request.',
    },
];

const alternateOutcomes = [
    { icon: CheckCircle2, label: getRepairStatusLabel('parcel_delivered'), note: 'The main sequence above reaches a completed state.' },
    { icon: Ban, label: getRepairStatusLabel('cancelled'), note: 'A request may instead be cancelled where it remains eligible - an alternate outcome, not a guaranteed final step for every request.' },
];

const ManagedWorkflow = () => (
    <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="tech-grid-pattern mx-auto max-w-6xl rounded-ds-xl border border-ds-ink-foreground/15 bg-ds-ink px-6 py-14 text-ds-ink-foreground sm:px-10 lg:px-14 lg:py-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="ds-label text-ds-action">How requests are managed</p>
                    <h2 className="mt-4 max-w-[18ch] text-title text-ds-ink-foreground">Managed repair workflow</h2>
                </div>
                <p className="max-w-md text-body-sm text-ds-ink-foreground/70">
                    Each repair request moves through defined responsibilities rather than an unmanaged handoff
                    between customer and technician.
                </p>
            </div>

            <ol className="mt-12 flex flex-col gap-7">
                {workflowSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <li key={step.label} className="flex gap-4">
                            <span
                                aria-hidden="true"
                                className="ds-numeric flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ds-ink-foreground/25 text-body-sm font-bold text-ds-ink-foreground"
                            >
                                {index + 1}
                            </span>
                            <div className="min-w-0 pt-1">
                                <p className="flex items-center gap-2 text-subhead text-ds-ink-foreground">
                                    <Icon aria-hidden="true" className="size-4 shrink-0 text-ds-ink-foreground/60" />
                                    {step.label}
                                </p>
                                <p className="mt-1.5 max-w-2xl text-body-sm text-ds-ink-foreground/70">{step.responsibility}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="mt-12 border-t border-ds-ink-foreground/15 pt-8">
                <p className="ds-label text-ds-ink-foreground/50">Final outcome</p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {alternateOutcomes.map((outcome) => {
                        const Icon = outcome.icon;
                        return (
                            <div key={outcome.label} className="flex gap-3 rounded-ds-lg border border-ds-ink-foreground/15 bg-ds-ink-foreground/5 p-5">
                                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-ink-foreground/60" />
                                <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-ds-ink-foreground">{outcome.label}</p>
                                    <p className="mt-1 text-micro text-ds-ink-foreground/70">{outcome.note}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </section>
);

export default ManagedWorkflow;
