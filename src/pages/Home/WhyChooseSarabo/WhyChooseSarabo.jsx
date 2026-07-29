import { FaUserCheck, FaEye, FaLock, FaClipboardCheck } from 'react-icons/fa';
import SectionHeader from '../../../components/public/SectionHeader';
import PublicFeatureCard from '../../../components/public/PublicFeatureCard';

// Four honest value propositions - no fabricated statistics, no unsupported
// claims. Kept at marketing-copy altitude, not internal transaction wording.
const values = [
    { icon: FaUserCheck, title: 'Approved Technicians', description: 'Technicians enter the workflow only after administrative approval.' },
    { icon: FaEye, title: 'Transparent Tracking', description: 'Customers can monitor the repair lifecycle using clear status labels.' },
    { icon: FaLock, title: 'Secure Payment Flow', description: 'Payment amounts and confirmation are validated by the server.' },
    { icon: FaClipboardCheck, title: 'Managed Service Process', description: 'Assignment, repair completion, and key workflow changes are protected by role-based controls.' },
];

const WhyChooseSarabo = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Why Sarabo"
            title="Why Choose Sarabo"
            description="A managed, accountable repair process from start to finish."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(value => (
                <PublicFeatureCard key={value.title} icon={value.icon} title={value.title} description={value.description} />
            ))}
        </div>
    </section>
);

export default WhyChooseSarabo;
