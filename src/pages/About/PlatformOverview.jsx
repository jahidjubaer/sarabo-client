import { ClipboardList, UserCheck, Route, ReceiptText } from 'lucide-react';
import PublicFeatureCard from '../../components/public/PublicFeatureCard';

// Content unchanged from the reviewed version - all four pillars preserved
// verbatim. Only the section header and grid moved onto the service-spine
// typography and surfaces (Phase 5A).
const pillars = [
    { icon: ClipboardList, title: 'Repair request management', description: 'Customers can submit and manage repair requests through a structured form and dashboard workflow.' },
    { icon: UserCheck, title: 'Technician assignment', description: 'Approved technicians can be assigned to eligible repair requests through controlled administrative actions.' },
    { icon: Route, title: 'Repair progress tracking', description: 'Repair lifecycle updates are represented through clear status labels and public or dashboard-based tracking where applicable.' },
    { icon: ReceiptText, title: 'Payment and completion records', description: 'Supported payment confirmation and repair completion information remain associated with the relevant service request.' },
];

const PlatformOverview = () => (
    <section className="border-t border-ds-border bg-ds-muted/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <p className="ds-label text-ds-primary">Platform overview</p>
            <h2 className="mt-3 max-w-[20ch] text-title text-ds-foreground">What Sarabo does</h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ds-muted-foreground">
                A structured set of capabilities for managing repair requests from submission to completion.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {pillars.map((pillar) => (
                    <PublicFeatureCard key={pillar.title} icon={pillar.icon} title={pillar.title} description={pillar.description} />
                ))}
            </div>
        </div>
    </section>
);

export default PlatformOverview;
