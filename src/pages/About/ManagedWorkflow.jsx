import { FaClipboardList, FaSearch, FaUserCheck, FaTools, FaFileInvoiceDollar, FaCheckCircle, FaBan } from 'react-icons/fa';
import DarkTechSection from '../../components/public/DarkTechSection';
import { getRepairStatusLabel } from '../../utils/repairStatus';

// Deliberately a vertical responsibility list rather than Home's horizontal
// icon-circle row (RepairLifecycle.jsx) - this section explains what each
// stage means for who's responsible, not just the bare status label. Labels
// that correspond to a real stored status reuse getRepairStatusLabel();
// "Request Reviewed", "Repair Activity Progresses", and "Payment Recorded
// Where Applicable" are narrative steps with no raw status equivalent.
const workflowSteps = [
    {
        icon: FaClipboardList,
        label: getRepairStatusLabel('pending-pickup'),
        responsibility: 'A customer submits a repair request with the required device and issue details.',
    },
    {
        icon: FaSearch,
        label: 'Request Reviewed',
        responsibility: 'The request becomes available for administrative oversight before technician assignment.',
    },
    {
        icon: FaUserCheck,
        label: getRepairStatusLabel('driver_assigned'),
        responsibility: 'An approved technician is assigned to the request through a controlled administrative action.',
    },
    {
        icon: FaTools,
        label: 'Repair Activity Progresses',
        responsibility: 'The assigned technician updates the repair status as service work moves forward.',
    },
    {
        icon: FaFileInvoiceDollar,
        label: 'Payment Recorded Where Applicable',
        responsibility: 'Supported payment confirmation is validated on the server and recorded against the request.',
    },
];

const alternateOutcomes = [
    { icon: FaCheckCircle, label: getRepairStatusLabel('parcel_delivered'), note: 'The main sequence above reaches a completed state.' },
    { icon: FaBan, label: getRepairStatusLabel('cancelled'), note: 'A request may instead be cancelled where it remains eligible - an alternate outcome, not a guaranteed final step for every request.' },
];

const ManagedWorkflow = () => (
    <DarkTechSection
        eyebrow="How Requests Are Managed"
        title="Managed Repair Workflow"
        description="Each repair request moves through defined responsibilities rather than an unmanaged handoff between customer and technician."
    >
        <ol className="flex flex-col gap-6">
            {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                    <li key={step.label} className="flex gap-4">
                        <Icon className="mt-1 h-6 w-6 shrink-0 text-brand-accent" aria-hidden="true" />
                        <div>
                            <p className="font-semibold text-on-dark">{step.label}</p>
                            <p className="mt-1 text-sm text-on-dark/70">{step.responsibility}</p>
                        </div>
                    </li>
                );
            })}
        </ol>

        <div className="mt-10 border-t border-on-dark/20 pt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Final Outcome</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {alternateOutcomes.map(outcome => {
                    const Icon = outcome.icon;
                    return (
                        <div key={outcome.label} className="flex gap-3 rounded-xl border border-on-dark/20 bg-white/5 p-4">
                            <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-accent" aria-hidden="true" />
                            <div>
                                <p className="font-semibold text-on-dark">{outcome.label}</p>
                                <p className="mt-1 text-sm text-on-dark/70">{outcome.note}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </DarkTechSection>
);

export default ManagedWorkflow;
