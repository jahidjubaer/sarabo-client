import { User, Wrench, ShieldCheck } from 'lucide-react';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

// Content unchanged from the reviewed version - all three role descriptions
// preserved verbatim. User-facing role name "Technician" only; the internal
// role value ("rider") is never exposed. Cards remain non-clickable: no single
// destination is correct for every visitor regardless of auth state or role.
// (Phase 5A: restyled only.)
const roles = [
    {
        icon: User,
        title: 'Customer',
        description: 'Submits repair requests, views request details, tracks progress, completes supported payments, and cancels eligible requests.',
    },
    {
        icon: Wrench,
        title: 'Technician',
        description: 'Accesses assigned repairs, updates allowed workflow stages, and completes assigned service actions - only after administrative approval, and only for requests assigned to them.',
    },
    {
        icon: ShieldCheck,
        title: 'Administrator',
        description: 'Manages users and technician applications, manages repair requests, assigns approved technicians, and oversees protected workflow operations.',
    },
];

const RoleEcosystem = () => (
    <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl">
            <p className="ds-label text-ds-primary">Who uses Sarabo</p>
            <h2 className="mt-3 max-w-[20ch] text-title text-ds-foreground">Role ecosystem</h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ds-muted-foreground">
                Sarabo separates responsibilities across three roles, each with access limited to its own part
                of the workflow.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {roles.map((role) => (
                    <PublicFeatureCard key={role.title} icon={role.icon} title={role.title} description={role.description} />
                ))}
            </div>
        </div>
    </section>
);

export default RoleEcosystem;
