import { FaUser, FaTools, FaUserShield } from 'react-icons/fa';
import SectionHeader from '../../components/public/SectionHeader';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

// User-facing role name "Technician" only - the internal role value ("rider")
// is never exposed here. Cards are intentionally non-clickable (no `action`
// prop) - no single destination is correct for every visitor regardless of
// whether they're signed in or which role they hold.
const roles = [
    {
        icon: FaUser,
        title: 'Customer',
        description: 'Submits repair requests, views request details, tracks progress, completes supported payments, and cancels eligible requests.',
    },
    {
        icon: FaTools,
        title: 'Technician',
        description: 'Accesses assigned repairs, updates allowed workflow stages, and completes assigned service actions - only after administrative approval, and only for requests assigned to them.',
    },
    {
        icon: FaUserShield,
        title: 'Administrator',
        description: 'Manages users and technician applications, manages repair requests, assigns approved technicians, and oversees protected workflow operations.',
    },
];

const RoleEcosystem = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Who Uses Sarabo"
            title="Role Ecosystem"
            description="Sarabo separates responsibilities across three roles, each with access limited to its own part of the workflow."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {roles.map(role => (
                <PublicFeatureCard key={role.title} icon={role.icon} title={role.title} description={role.description} />
            ))}
        </div>
    </section>
);

export default RoleEcosystem;
