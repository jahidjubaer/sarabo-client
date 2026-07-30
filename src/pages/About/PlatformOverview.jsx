import { FaClipboardList, FaUserCheck, FaRoute, FaFileInvoiceDollar } from 'react-icons/fa';
import SectionHeader from '../../components/public/SectionHeader';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

const pillars = [
    { icon: FaClipboardList, title: 'Repair Request Management', description: 'Customers can submit and manage repair requests through a structured form and dashboard workflow.' },
    { icon: FaUserCheck, title: 'Technician Assignment', description: 'Approved technicians can be assigned to eligible repair requests through controlled administrative actions.' },
    { icon: FaRoute, title: 'Repair Progress Tracking', description: 'Repair lifecycle updates are represented through clear status labels and public or dashboard-based tracking where applicable.' },
    { icon: FaFileInvoiceDollar, title: 'Payment and Completion Records', description: 'Supported payment confirmation and repair completion information remain associated with the relevant service request.' },
];

const PlatformOverview = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Platform Overview"
            title="What Sarabo Does"
            description="A structured set of capabilities for managing repair requests from submission to completion."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map(pillar => (
                <PublicFeatureCard key={pillar.title} icon={pillar.icon} title={pillar.title} description={pillar.description} />
            ))}
        </div>
    </section>
);

export default PlatformOverview;
