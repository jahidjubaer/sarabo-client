import CTAPanel from '../../../components/public/CTAPanel';

// CTAPanel carries no auth/role logic itself - route guards remain the
// actual access boundary for /dashboard/create-request.
const FinalCTA = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <CTAPanel
            eyebrow="Ready to Get Started?"
            heading="Manage Your Repair Request With Greater Clarity"
            description="Submit a repair request, follow its progress, and keep important service details in one place."
            primaryAction={{ label: 'Request a Repair', to: '/dashboard/create-request' }}
            secondaryAction={{ label: 'Track a Repair', to: '/track-request' }}
        />
    </section>
);

export default FinalCTA;
