import { ClipboardList, UserCheck, Route, ReceiptText } from 'lucide-react';
import SectionHeader from '../../components/public/SectionHeader';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

const pillars = [
    { icon: ClipboardList, title: 'Repair request management', description: 'Customers can submit and manage repair requests through a structured form and dashboard workflow.' },
    { icon: UserCheck, title: 'Technician assignment', description: 'Approved technicians can be assigned to eligible repair requests through controlled administrative actions.' },
    { icon: Route, title: 'Repair progress tracking', description: 'Repair lifecycle updates are represented through clear status labels and public or dashboard-based tracking where applicable.' },
    { icon: ReceiptText, title: 'Payment and completion records', description: 'Supported payment confirmation and repair completion information remain associated with the relevant service request.' },
];

const PlatformOverview = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
            <SectionHeader
                eyebrow="Platform overview"
                title="What Sarabo does"
                description="A structured set of capabilities for managing repair requests from submission to completion."
            />
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {pillars.map((pillar) => (
                    <PublicFeatureCard key={pillar.title} icon={pillar.icon} title={pillar.title} description={pillar.description} />
                ))}
            </div>
        </div>
    </section>
);

export default PlatformOverview;
