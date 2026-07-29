import { FaUserCheck, FaUserShield, FaLock, FaHistory } from 'react-icons/fa';
import SectionHeader from '../../../components/public/SectionHeader';
import PublicFeatureCard from '../../../components/public/PublicFeatureCard';

// Four evidence-based trust points - no fake badges, certifications, quotes,
// or statistics. Wording deliberately avoids overreaching claims (no "fully
// secure", "fraud-proof", "bank-grade", "PCI compliant", "end-to-end
// encrypted", "insured", "background-checked", or guarantee language).
const trustPoints = [
    { icon: FaUserCheck, title: 'Approved Technician Access', description: 'Technicians join the service workflow only after administrative approval.' },
    { icon: FaUserShield, title: 'Role-Protected Operations', description: 'Customer, technician, and admin actions are separated through role-based access controls.' },
    { icon: FaLock, title: 'Server-Validated Payments', description: 'Payment amounts and confirmation are validated on the server before completion is recorded.' },
    { icon: FaHistory, title: 'Trackable Repair History', description: 'Important request, assignment, payment, and completion updates remain associated with the repair record.' },
];

// Muted (bg-base-200) rather than a second dark panel - RepairLifecycle
// immediately above already provides the dark technical contrast beat, so
// stacking another one here would read as monotone rather than restrained.
const TrustAndSafety = () => (
    <section className="bg-base-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Trust & Safety"
            title="Built on Accountable Processes"
            description="Sarabo's workflow is structured around administrative approval, role separation, and server-side validation."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map(point => (
                <PublicFeatureCard key={point.title} icon={point.icon} title={point.title} description={point.description} />
            ))}
        </div>
    </section>
);

export default TrustAndSafety;
