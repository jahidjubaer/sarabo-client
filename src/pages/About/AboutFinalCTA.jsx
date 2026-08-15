import CTABand from '../../components/public/CTABand';

// Closing action for About (Phase 5A). CTAPanel is gone; this is the shared
// ink band, which is role-aware via the same helper the rest of the public
// site uses - route guards remain the actual access boundary.
//
// The old copy ("Start With a Clearer Repair Process" / "Submit, Manage and
// Track Your Repair Request") was title-cased marketing phrasing; the meaning
// is preserved in sentence case, consistent with every other page.
const AboutFinalCTA = () => (
    <CTABand
        eyebrow="Start with a clearer repair process"
        heading="Submit, manage and track your repair request."
        description="Use Sarabo's structured workflow to keep repair details, progress, and supported service records organized in one place."
    />
);

export default AboutFinalCTA;
