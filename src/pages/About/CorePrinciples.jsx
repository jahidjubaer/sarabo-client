import { Eye, ClipboardCheck, ShieldCheck, Settings } from 'lucide-react';
import SectionHeader from '../../components/public/SectionHeader';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

const principles = [
    { icon: Eye, title: 'Clarity', description: 'Repair information and status should be understandable to the relevant user.' },
    { icon: ClipboardCheck, title: 'Accountability', description: 'Important actions remain associated with the repair request and authorized role.' },
    { icon: ShieldCheck, title: 'Controlled access', description: 'Role-based controls separate customer, technician, and administrative actions.' },
    { icon: Settings, title: 'Practical service management', description: 'The platform prioritizes a usable workflow over unsupported automation claims.' },
];

// Muted section, no statistics, no certifications. (Phase 7.9: ds-*/Lucide.)
const CorePrinciples = () => (
    <section className="bg-ds-muted/40 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
            <SectionHeader
                eyebrow="How we operate"
                title="Core principles"
                description="The principles that guide how Sarabo's workflow is structured."
            />
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {principles.map((principle) => (
                    <PublicFeatureCard key={principle.title} icon={principle.icon} title={principle.title} description={principle.description} />
                ))}
            </div>
        </div>
    </section>
);

export default CorePrinciples;
