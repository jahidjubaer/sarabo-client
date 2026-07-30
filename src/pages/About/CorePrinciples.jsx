import { FaEye, FaClipboardCheck, FaUserShield, FaCogs } from 'react-icons/fa';
import SectionHeader from '../../components/public/SectionHeader';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

const principles = [
    { icon: FaEye, title: 'Clarity', description: 'Repair information and status should be understandable to the relevant user.' },
    { icon: FaClipboardCheck, title: 'Accountability', description: 'Important actions remain associated with the repair request and authorized role.' },
    { icon: FaUserShield, title: 'Controlled Access', description: 'Role-based controls separate customer, technician, and administrative actions.' },
    { icon: FaCogs, title: 'Practical Service Management', description: 'The platform prioritizes a usable workflow over unsupported automation claims.' },
];

// Muted section, no statistics, no certifications.
const CorePrinciples = () => (
    <section className="bg-base-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="How We Operate"
            title="Core Principles"
            description="The principles that guide how Sarabo's workflow is structured."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(principle => (
                <PublicFeatureCard key={principle.title} icon={principle.icon} title={principle.title} description={principle.description} />
            ))}
        </div>
    </section>
);

export default CorePrinciples;
