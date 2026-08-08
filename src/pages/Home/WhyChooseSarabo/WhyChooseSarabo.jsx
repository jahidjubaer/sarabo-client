import { motion as Motion, MotionConfig } from 'motion/react';
import { UserCheck, Eye, Lock, ClipboardCheck } from 'lucide-react';
import SectionHeader from '../../../components/public/SectionHeader';
import PublicFeatureCard from '../../../components/public/PublicFeatureCard';
import { staggerContainer, staggerItem } from '../../../theme/motion';

// Four honest value propositions (Phase 7.8, Lucide + ds-*) - no fabricated
// statistics, no unsupported claims. Marketing-copy altitude, not internal
// transaction wording.
const values = [
    { icon: UserCheck, title: 'Approved technicians', description: 'Technicians enter the workflow only after administrative approval.' },
    { icon: Eye, title: 'Transparent tracking', description: 'Customers can monitor the repair lifecycle using clear status labels.' },
    { icon: Lock, title: 'Secure payment flow', description: 'Payment amounts and confirmation are validated by the server.' },
    { icon: ClipboardCheck, title: 'Managed service process', description: 'Assignment, completion, and key workflow changes are protected by role-based controls.' },
];

const WhyChooseSarabo = () => (
    <MotionConfig reducedMotion="user">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeader
                    eyebrow="Why Sarabo"
                    title="Why choose Sarabo"
                    description="A managed, accountable repair process from start to finish."
                />
                <Motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {values.map((value) => (
                        <Motion.div key={value.title} variants={staggerItem}>
                            <PublicFeatureCard icon={value.icon} title={value.title} description={value.description} />
                        </Motion.div>
                    ))}
                </Motion.div>
            </div>
        </section>
    </MotionConfig>
);

export default WhyChooseSarabo;
