import CTAPanel from '../../components/public/CTAPanel';

// CTAPanel carries no auth/role logic itself - route guards remain the
// actual access boundary for /dashboard/create-request.
const AboutFinalCTA = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <CTAPanel
            eyebrow="Start With a Clearer Repair Process"
            heading="Submit, Manage and Track Your Repair Request"
            description="Use Sarabo's structured workflow to keep repair details, progress, and supported service records organized in one place."
            primaryAction={{ label: 'Request a Repair', to: '/dashboard/create-request' }}
            secondaryAction={{ label: 'Track a Repair', to: '/track-request' }}
        />
    </section>
);

export default AboutFinalCTA;
