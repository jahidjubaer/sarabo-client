import { motion as Motion, MotionConfig } from 'motion/react';
import { UserCheck, ShieldCheck, FileCheck, Lock, Activity, Image } from 'lucide-react';
import SectionHeader from '../../../components/public/SectionHeader';
import PublicFeatureCard from '../../../components/public/PublicFeatureCard';
import { TRUST_POINTS } from '../../../utils/publicContent';
import { staggerContainer, staggerItem } from '../../../theme/motion';

// Capability-based trust points (Phase 7.8) sourced from the content module -
// each reflects a real product mechanism. No fake badges, certifications,
// quotes, or statistics; wording avoids overreaching security claims.
const ICONS = {
    'user-check': UserCheck,
    shield: ShieldCheck,
    'file-check': FileCheck,
    lock: Lock,
    activity: Activity,
    image: Image,
};

const TrustAndSafety = () => (
    <MotionConfig reducedMotion="user">
        <section className="bg-ds-muted/40 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeader
                    eyebrow="Trust & safety"
                    title="Built on accountable processes"
                    description="Sarabo's workflow is structured around administrative approval, role separation, and server-side validation."
                />
                <Motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.12 }}
                    className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {TRUST_POINTS.map((point) => (
                        <Motion.div key={point.key} variants={staggerItem}>
                            <PublicFeatureCard icon={ICONS[point.iconKey]} title={point.title} description={point.description} />
                        </Motion.div>
                    ))}
                </Motion.div>
            </div>
        </section>
    </MotionConfig>
);

export default TrustAndSafety;
