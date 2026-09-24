// Pure content + presentation helpers for the public site (redesign Phase 2).
// No fetching and no fabricated claims (no counts, guarantees, turnaround
// times, ratings or testimonials) - only what the product actually does. Every
// piece of public copy that appears in more than one place lives here, so the
// request -> quote -> track story is told once and never drifts.

export const REQUEST_REPAIR_ROUTE = '/dashboard/create-request';

// Existing technician-application route (PrivateRoute-guarded; a logged-out
// visitor is sent through the existing auth flow).
export const BECOME_TECHNICIAN_ROUTE = '/become-technician';

// Public, unauthenticated repair tracking.
export const TRACK_REPAIR_ROUTE = '/track-request';

// Starts the opt-in product tour on the homepage (see components/tour).
export const TOUR_ROUTE = '/?tour=start';

// Hero copy. Short enough to take in within a few seconds; every clause in
// the description is a mechanism the platform enforces.
export const HERO = {
    eyebrow: 'Electronics & appliance repair',
    headline: 'Repair your device with confidence.',
    description: 'Approved technicians, an itemised quote before any work starts, and every step tracked.',
};

// One sentence per public stage, keyed by the canonical stage key from
// SPINE_STAGES in utils/repairStage.js (which owns the stage names).
export const SPINE_STEP_COPY = {
    request: 'Choose the device, describe the fault and add photos.',
    inspect: 'An approved technician collects it and records what is wrong.',
    approve: 'Approve or decline an itemised quote. Pay only if you approve.',
    repaired: 'Follow updates, then confirm when the device is back.',
};

// FAQ. Every answer describes how the platform behaves - no refund, warranty
// or turnaround promises, because none exist.
export const FAQS = [
    {
        question: 'How much will my repair cost?',
        answer: 'Each service lists an estimated range. The technician sends an itemised quote after inspecting the device, and nothing is charged until you approve it.',
    },
    {
        question: 'Can I decline a quote?',
        answer: 'Yes. Approving a quote is a decision, not a payment. If you decline, the repair does not go ahead.',
    },
    {
        question: 'How do I track my repair?',
        answer: 'Every request gets a tracking code you can enter on Track a repair without signing in. Signed in, your dashboard shows the full record of your own requests.',
    },
    {
        question: 'How is a technician chosen?',
        answer: 'An administrator assigns an approved technician whose expertise and service area match your request. Technicians can only take work after their application is reviewed.',
    },
    {
        question: 'What happens when the repair is done?',
        answer: 'The technician marks the repair complete, and you confirm in your request once the device is back in your hands.',
    },
];

// Footer navigation - only routes that exist.
export const FOOTER_GROUPS = [
    {
        heading: 'Repairs',
        links: [
            { label: 'Services', to: '/services' },
            { label: 'Service areas', to: '/service-areas' },
            { label: 'Track a repair', to: TRACK_REPAIR_ROUTE },
            { label: 'Request a repair', to: REQUEST_REPAIR_ROUTE },
        ],
    },
    {
        heading: 'Sarabo',
        links: [
            { label: 'About', to: '/about' },
            { label: 'Become a technician', to: BECOME_TECHNICIAN_ROUTE },
            { label: 'Take the tour', to: TOUR_ROUTE },
        ],
    },
];

// Primary public navigation (desktop bar and mobile sheet share it). Four
// destinations so the full bar fits from 1024px. Home is the logo; "Become a
// technician" lives in the footer and the account menu.
export const PUBLIC_NAV_LINKS = [
    { label: 'Services', to: '/services' },
    { label: 'Service areas', to: '/service-areas' },
    { label: 'Track a repair', to: TRACK_REPAIR_ROUTE },
    { label: 'About', to: '/about' },
];

// Anonymous visitors and signed-in customers are offered "Request a repair";
// technicians and admins are not, and nothing is offered while the role is
// still resolving for a signed-in user.
export function shouldShowCreateRequestLink({ user, role } = {}) {
    return !user || role === 'user';
}

export function getRequestRepairAction() {
    return { label: 'Request a repair', to: REQUEST_REPAIR_ROUTE };
}

// Link to a category-prefilled request form.
export function getCategoryRequestRoute(slug) {
    return `${REQUEST_REPAIR_ROUTE}?category=${encodeURIComponent(slug)}`;
}

// Path-aware active matching for the public nav: a link is active on its own
// path and anything nested under it.
export function isPublicNavLinkActive(pathname, link) {
    if (!link || typeof link.to !== 'string' || typeof pathname !== 'string') return false;
    if (link.end) return pathname === link.to;
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
}
