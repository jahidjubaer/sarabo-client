// Pure content + presentation helpers for the public marketing site (Phase
// 7.8). No fetching, no fabricated claims (no counts, guarantees, turnaround
// times, testimonials) - only what the product actually does. Component icon
// lookups live in the components; this module holds copy and the small
// auth-aware CTA logic so both can be unit-checked without React.

export const REQUEST_REPAIR_ROUTE = '/dashboard/create-request';

// Hero copy - product-specific, not generic startup language. Actions point at
// real routes; route guards remain the actual access boundary for the request
// route (a logged-out visitor is sent through the existing auth flow).
export const HERO = {
    eyebrow: 'Electronics & appliance repair',
    headline: 'Trusted repairs, tracked from request to completion',
    description: 'Submit a repair request, get matched with an approved technician, review a transparent quote, and follow every stage in one place.',
    primaryAction: { label: 'Request a Repair', to: REQUEST_REPAIR_ROUTE },
    secondaryAction: { label: 'How it works', to: '#how-it-works' },
};

// Condensed four-beat lifecycle for the hero visual (a marketing
// simplification). The status-accurate lifecycle lives in RepairLifecycle,
// which maps real stored statuses through getRepairStatusLabel.
export const HERO_LIFECYCLE = [
    { key: 'request', label: 'Request' },
    { key: 'inspect', label: 'Inspect' },
    { key: 'quote', label: 'Quote' },
    { key: 'repair', label: 'Repair' },
];

// Public "How Sarabo works" steps - user-facing labels only, never internal
// status strings (parcel_picked_up, inspection_completed, ...).
export const HOW_IT_WORKS_STEPS = [
    { key: 'submit', title: 'Submit a request', description: 'Tell us about your device and the problem through the request form.' },
    { key: 'assign', title: 'Technician assigned', description: 'An approved technician is matched through the managed service workflow.' },
    { key: 'inspect', title: 'Device inspection', description: 'The technician inspects the device and identifies what the repair needs.' },
    { key: 'quote', title: 'Review the quote', description: 'You receive a transparent repair quote to review before any work begins.' },
    { key: 'pay', title: 'Approve and pay', description: 'Repair starts only after you approve the quote and complete payment.' },
    { key: 'complete', title: 'Repair completed', description: 'Track progress to completion, with photo evidence where provided.' },
];

// Service categories shown on the homepage and Services page. Customer-facing
// labels + blurbs only - no serviceDefinitionId, slug, pricingVersion, or raw
// taxonomy fields. `iconKey` is resolved to a Lucide glyph in the component.
export const SERVICE_CATEGORIES = [
    { key: 'ac', iconKey: 'ac', label: 'AC Repair', blurb: 'Installation, gas refilling, cooling issues, and general maintenance.' },
    { key: 'refrigerator', iconKey: 'refrigerator', label: 'Refrigerator Repair', blurb: 'Cooling problems, compressor issues, gas leakage, and servicing.' },
    { key: 'washing-machine', iconKey: 'washing-machine', label: 'Washing Machine Repair', blurb: 'Drum, motor, drainage, and control-panel repairs.' },
    { key: 'tv', iconKey: 'tv', label: 'TV / Electronics Repair', blurb: 'Display, sound, and connectivity issues for TVs and electronics.' },
    { key: 'mobile', iconKey: 'mobile', label: 'Mobile Phone Repair', blurb: 'Screen, battery, charging port, and software troubleshooting.' },
    { key: 'laptop', iconKey: 'laptop', label: 'Laptop / Computer Repair', blurb: 'Hardware diagnostics, performance issues, and general repair.' },
    { key: 'microwave', iconKey: 'microwave', label: 'Microwave Repair', blurb: 'Heating, turntable, and control issues for microwave ovens.' },
    { key: 'other', iconKey: 'other', label: 'Other Repairs', blurb: 'Another appliance or device? Choose “Other” and describe the issue.' },
];

// Capability-based trust points - each one reflects a real product mechanism,
// no numeric stats, badges, or certifications.
export const TRUST_POINTS = [
    { key: 'approved', iconKey: 'user-check', title: 'Approved technicians', description: 'Technicians join the workflow only after administrative approval.' },
    { key: 'roles', iconKey: 'shield', title: 'Role-protected operations', description: 'Customer, technician, and admin actions are separated by role-based access.' },
    { key: 'quote', iconKey: 'file-check', title: 'Transparent quotes', description: 'You review and approve the repair quote before any work begins.' },
    { key: 'payment', iconKey: 'lock', title: 'Server-validated payments', description: 'Payment amounts and confirmation are validated on the server.' },
    { key: 'progress', iconKey: 'activity', title: 'Repair progress tracking', description: 'Follow the repair through clear status updates from start to finish.' },
    { key: 'evidence', iconKey: 'image', title: 'Completion evidence', description: 'Completed repairs can include photo evidence attached to the record.' },
];

// FAQ content - drawn from existing project copy / safe product facts. No
// invented refund/warranty/turnaround promises.
export const FAQS = [
    { question: 'How do I submit a repair request?', answer: 'Create or sign in to your account, open the repair-request form, and provide the device and issue details the form asks for.' },
    { question: 'Can I track a repair without opening the dashboard?', answer: 'Yes. Use the public tracking page and enter the repair tracking information provided for the request.' },
    { question: 'How is a technician assigned?', answer: 'An approved technician is assigned through Sarabo’s managed service workflow, based on the available request and the administrative process.' },
    { question: 'When is payment required?', answer: 'Payment depends on the applicable repair workflow. Where online payment is available, the platform validates the amount and confirmation before recording the result.' },
    { question: 'Can I cancel a repair request?', answer: 'Eligible requests can be cancelled before the repair progresses beyond the allowed stage. The platform prevents cancellation once a request is too far along.' },
    { question: 'How can I become a technician?', answer: 'Submit the technician application form. An administrator reviews the application before technician access is approved.' },
];

// Footer navigation - only verified existing routes, no invented
// Contact/Privacy/Terms/social destinations.
export const FOOTER_GROUPS = [
    {
        heading: 'Explore',
        links: [
            { label: 'Home', to: '/' },
            { label: 'Services', to: '/services' },
            { label: 'Service Areas', to: '/service-areas' },
            { label: 'Track Repair', to: '/track-request' },
            { label: 'About', to: '/about' },
        ],
    },
    {
        heading: 'Account & Service',
        links: [
            { label: 'Request a Repair', to: REQUEST_REPAIR_ROUTE },
            { label: 'Become a Technician', to: '/become-technician' },
            { label: 'Dashboard', to: '/dashboard' },
        ],
    },
];

// Primary public navigation destinations (both desktop bar and mobile sheet
// use this single source, so the two never drift).
export const PUBLIC_NAV_LINKS = [
    { label: 'Home', to: '/', end: true },
    { label: 'Services', to: '/services' },
    { label: 'Service Areas', to: '/service-areas' },
    { label: 'Track Repair', to: '/track-request' },
    { label: 'About', to: '/about' },
];

// Mirrors the existing navbar rule exactly: the "Create Repair Request" link
// shows for anonymous visitors (preserving prior behavior) and for signed-in
// customers, but never for admin/technician or while the role is unresolved.
export function shouldShowCreateRequestLink({ user, role } = {}) {
    return !user || role === 'user';
}

// The hero/CTA "Request a Repair" action is a constant route; guards decide
// what actually happens for a given auth state. Exposed as a helper so call
// sites and checks share one definition.
export function getRequestRepairAction() {
    return { label: 'Request a Repair', to: REQUEST_REPAIR_ROUTE };
}

// Existing technician-application route (PrivateRoute-guarded; a logged-out
// visitor is sent through the existing auth flow). No new route is created.
export const BECOME_TECHNICIAN_ROUTE = '/become-technician';

// Show "Become a Technician" to anyone who is not already a technician or an
// admin - i.e. anonymous visitors and customers. Hidden for rider/admin (for
// whom it is redundant) and never guessed while the role is mid-resolution
// with a signed-in user.
export function shouldShowBecomeTechnicianLink({ user, role } = {}) {
    if (!user) return true;
    return role === 'user';
}

// Exact/path-aware active matching for the public nav. A link marked `end`
// (Home, "/") is active ONLY on an exact path match, so it never lights up on
// every route just because "/" is a prefix; other links also match their own
// nested paths (e.g. /services/anything).
export function isPublicNavLinkActive(pathname, link) {
    if (!link || typeof link.to !== 'string' || typeof pathname !== 'string') return false;
    if (link.end) return pathname === link.to;
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
}

// Purpose-built hero carousel slides (Phase 7.10). Copy stays grounded in real
// product capabilities - no stats, guarantees, or turnaround claims. `visual`
// selects a designed CSS/Motion panel in the carousel (no imagery, no Swiper).
export const HERO_SLIDES = [
    {
        key: 'journey',
        eyebrow: 'Transparent repair journey',
        headline: 'Trusted repairs, tracked from request to completion',
        description: 'Submit a request, get matched with an approved technician, review a transparent quote, and follow every stage in one place.',
        visual: 'lifecycle',
    },
    {
        key: 'devices',
        eyebrow: 'Many device categories',
        headline: 'From smartphones to home appliances',
        description: 'Phones, laptops, TVs, and major appliances - describe the problem and we route it to a technician who can help.',
        visual: 'devices',
    },
    {
        key: 'tracking',
        eyebrow: 'End-to-end tracking',
        headline: 'Follow the whole process, step by step',
        description: 'Assignment, quote, payment, repair progress, and completion - each stage is visible and accountable.',
        visual: 'process',
    },
];
