import { FaClipboardList, FaUserCheck, FaRoute, FaTools, FaCheckCircle, FaBan } from 'react-icons/fa';
import DarkTechSection from '../../../components/public/DarkTechSection';
import { getRepairStatusLabel } from '../../../utils/repairStatus';

// Raw stored status values, mapped through the single existing label utility
// so nothing here can drift from what the dashboard actually displays, and no
// internal status string is ever rendered directly.
const mainFlow = [
    { status: 'pending-pickup', icon: FaClipboardList },
    { status: 'driver_assigned', icon: FaUserCheck },
    { status: 'rider_arriving', icon: FaRoute },
    { status: 'parcel_picked_up', icon: FaTools },
    { status: 'parcel_delivered', icon: FaCheckCircle },
];

const RepairLifecycle = () => (
    <DarkTechSection
        eyebrow="Repair Lifecycle"
        title="Follow Every Stage of Your Repair"
        description="Sarabo tracks each repair request through a clear, managed sequence of statuses."
    >
        <div className="relative">
            <div className="absolute inset-x-[10%] top-6 hidden h-0.5 bg-on-dark/20 lg:block" aria-hidden="true"></div>
            <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-5">
                {mainFlow.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <li key={step.status} className="flex flex-col items-center gap-2 text-center">
                            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent font-bold text-surface-dark">
                                {index + 1}
                            </div>
                            <Icon className="text-xl text-brand-accent" aria-hidden="true" />
                            <p className="text-sm font-medium text-on-dark">{getRepairStatusLabel(step.status)}</p>
                        </li>
                    );
                })}
            </ol>
        </div>

        {/* Cancellation is a separate alternate outcome, not a sequential
        final step after completion - shown outside the ordered flow above. */}
        <div className="mt-12 border-t border-on-dark/20 pt-8">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-xl border border-on-dark/20 bg-white/5 p-6 text-center">
                <FaBan className="text-2xl text-brand-priority" aria-hidden="true" />
                <p className="text-sm font-medium text-on-dark">{getRepairStatusLabel('cancelled')}</p>
                <p className="text-xs text-on-dark/70">A repair request may be cancelled instead of completing the sequence above.</p>
            </div>
        </div>
    </DarkTechSection>
);

export default RepairLifecycle;
