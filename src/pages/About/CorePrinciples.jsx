import { Eye, ClipboardCheck, ShieldCheck, Settings } from 'lucide-react';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

// Content unchanged from the reviewed version - all four principles preserved
// verbatim. No statistics, no certifications. (Phase 5A: restyled only.)
const principles = [
    { icon: Eye, title: 'Clarity', description: 'Repair information and status should be understandable to the relevant user.' },
    { icon: ClipboardCheck, title: 'Accountability', description: 'Important actions remain associated with the repair request and authorized role.' },
    { icon: ShieldCheck, title: 'Controlled access', description: 'Role-based controls separate customer, technician, and administrative actions.' },
    { icon: Settings, title: 'Practical service management', description: 'The platform prioritizes a usable workflow over unsupported automation claims.' },
];

const CorePrinciples = () => (
    <section className="border-t border-ds-border bg-ds-muted/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <p className="ds-label text-ds-primary">How we operate</p>
            <h2 className="mt-3 max-w-[20ch] text-title text-ds-foreground">Core principles</h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ds-muted-foreground">
                The principles that guide how Sarabo&rsquo;s workflow is structured.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {principles.map((principle) => (
                    <PublicFeatureCard key={principle.title} icon={principle.icon} title={principle.title} description={principle.description} />
                ))}
            </div>
        </div>
    </section>
);

export default CorePrinciples;
