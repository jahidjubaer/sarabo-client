import { FaTools, FaRoute, FaUserCheck } from 'react-icons/fa';

// Local static Hero content. No fabricated claims (no "fastest", "guaranteed",
// "thousands of customers", etc.) - only what the current product actually does.
// `icon` drives the CSS-only visual panel - no repair/device photography
// exists in the repo yet (only logo.png), see HeroSwiper.jsx's file comment
// for the exact real-photo placeholders this should become later.
// `headingLevel` is static per slide (not derived from which slide is
// currently active) so the document outline never changes while autoplay
// cycles - only slide 1 is the page's real <h1>; slides 2-3 are <h2>, since
// all three remain mounted in the DOM simultaneously (Swiper doesn't unmount
// inactive slides).
export const heroSlides = [
    {
        id: 'request-to-completion',
        eyebrow: 'Device Repair, Simplified',
        headline: 'Trusted Repair Support From Request to Completion',
        description: 'Submit your repair request, stay informed throughout the service process, and manage everything from one secure platform.',
        primaryAction: { label: 'Request a Repair', to: '/dashboard/create-request' },
        secondaryAction: { label: 'Track a Repair', to: '/track-request' },
        icon: FaTools,
        headingLevel: 1,
    },
    {
        id: 'transparent-progress',
        eyebrow: 'Transparent Progress',
        headline: 'Know What Is Happening at Every Step',
        description: 'Follow your repair from request submission to technician assignment, service progress, and completion.',
        primaryAction: { label: 'Track Your Repair', to: '/track-request' },
        secondaryAction: { label: 'How It Works', to: '#how-it-works' },
        icon: FaRoute,
        headingLevel: 2,
    },
    {
        id: 'accountable-service',
        eyebrow: 'Accountable Service',
        headline: 'Verified Technicians and a Clear Repair Process',
        description: 'Sarabo connects customers with approved technicians through an admin-supervised and trackable workflow.',
        primaryAction: { label: 'Explore Services', to: '/services' },
        secondaryAction: { label: 'Become a Technician', to: '/become-technician' },
        icon: FaUserCheck,
        headingLevel: 2,
    },
];
