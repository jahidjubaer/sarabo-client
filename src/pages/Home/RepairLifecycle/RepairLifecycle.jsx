import { motion as Motion, MotionConfig } from 'motion/react';
import { ClipboardList, UserCheck, Route, Wrench, CheckCircle2, Ban } from 'lucide-react';
import DarkTechSection from '../../../components/public/DarkTechSection';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { staggerContainer, staggerItem } from '../../../theme/motion';

// Status-accurate repair lifecycle (Phase 7.8, icons migrated to Lucide).
// Raw stored status values are mapped through the single existing label
// utility so nothing here can drift from what the dashboard displays, and no
// internal status string is ever rendered directly. Rendered inside the
// always-dark DarkTechSection (brand palette), so it reads on both themes.
const mainFlow = [
    { status: 'pending-pickup', icon: ClipboardList },
    { status: 'driver_assigned', icon: UserCheck },
    { status: 'rider_arriving', icon: Route },
    { status: 'parcel_picked_up', icon: Wrench },
    { status: 'parcel_delivered', icon: CheckCircle2 },
];

const RepairLifecycle = () => (
    <DarkTechSection
        eyebrow="Repair lifecycle"
        title="Follow every stage of your repair"
        description="Sarabo tracks each repair request through a clear, managed sequence of statuses."
    >
        <MotionConfig reducedMotion="user">
            <div className="relative">
                <div className="absolute inset-x-[10%] top-6 hidden h-px bg-on-dark/20 lg:block" aria-hidden="true" />
                <Motion.ol
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5"
                >
                    {mainFlow.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Motion.li key={step.status} variants={staggerItem} className="flex flex-col items-center gap-2 text-center">
                                <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-brand-accent font-bold text-surface-dark">
                                    {index + 1}
                                </span>
                                <Icon aria-hidden="true" className="size-5 text-brand-accent" />
                                <p className="text-sm font-medium text-on-dark">{getRepairStatusLabel(step.status)}</p>
                            </Motion.li>
                        );
                    })}
                </Motion.ol>
            </div>

            {/* Cancellation is a separate alternate outcome, not a sequential
            final step after completion - shown outside the ordered flow above. */}
            <div className="mt-12 border-t border-on-dark/20 pt-8">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-ds-lg border border-on-dark/20 bg-white/5 p-6 text-center">
                    <Ban aria-hidden="true" className="size-6 text-brand-priority" />
                    <p className="text-sm font-medium text-on-dark">{getRepairStatusLabel('cancelled')}</p>
                    <p className="text-xs text-on-dark/70">A repair request may be cancelled instead of completing the sequence above.</p>
                </div>
            </div>
        </MotionConfig>
    </DarkTechSection>
);

export default RepairLifecycle;
