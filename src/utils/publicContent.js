// Pure content + presentation helpers for the public marketing site (Phase
// 7.8). No fetching, no fabricated claims (no counts, guarantees, turnaround
// times, testimonials) - only what the product actually does. Component icon
// lookups live in the components; this module holds copy and the small
// auth-aware CTA logic so both can be unit-checked without React.

export const REQUEST_REPAIR_ROUTE = '/dashboard/create-request';

// Existing technician-application route (PrivateRoute-guarded; a logged-out
// visitor is sent through the existing auth flow). No new route is created.
// Declared here, beside the other route constant, because PUBLIC_NAV_LINKS now
// references it - a `const` used before its declaration would throw at module
// evaluation, not at call time.
export const BECOME_TECHNICIAN_ROUTE = '/become-technician';

// Public, unauthenticated repair tracking. Named here so the homepage and the
// nav reference one definition of the path rather than repeating the literal.
export const TRACK_REPAIR_ROUTE = '/track-request';

// Hero copy (Phase 3). Grounded, not promotional: every clause describes a
// mechanism the platform actually implements. No counts, certifications,
// turnaround promises, warranties, ratings or "genuine parts" claims.
export const HERO = {
    eyebrow: 'Electronics & appliance repair',
    // Split so the hero can highlight exactly one word. Rejoined they read as
    // one sentence; nothing depends on the split but the underline.
    headlineLead: 'Repair your electronics with a',
    headlineAccent: 'clear process.',
    description: 'Request a repair, have an approved technician inspect the device, review the quote before any work starts, and follow the repair through to completion.',
};

// Three short statements for the hero. Each names a mechanism the platform
// actually enforces - free submission, approval gating the work, and public
// tracking by code. No counts, guarantees or turnaround claims.
export const HERO_ASSURANCES = [
    'Submitting a request is free',
    'Nothing is repaired until you approve the quote',
    'Track your repair by code, no login needed',
];

// The four public stages, with one sentence each. The stage names themselves
// come from SPINE_STAGES in utils/repairStage.js - the single source the whole
// product uses - so this module only supplies the explanatory copy, keyed by
// the canonical stage key. It can never drift into a fifth stage or a renamed
// one.
export const SPINE_STEP_COPY = {
    request: 'Tell us what device needs repair and what is wrong with it.',
    inspect: 'An approved technician collects the device and inspects the fault.',
    approve: 'Review the itemised quote. Nothing is repaired until you approve it.',
    repaired: 'Follow the repair through to completion, then confirm you have the device back.',
};

// FAQ (Phase 3). Every answer describes how the platform actually behaves -
// assignment is administrative, the quote gates the repair, payment follows
// approval, tracking is by code, and the customer confirms handover. No
// refund, warranty or turnaround promises, because none exist.
export const FAQS = [
    {
        question: 'How does the repair process work?',
        answer: 'You submit a repair request describing the device and the fault. An approved technician is assigned, collects the device and inspects it. You then receive an itemised quote to approve or decline, and the repair only begins once it is approved and paid.',
    },
    {
        question: 'When do I find out the price?',
        answer: 'After the inspection. Choosing a service shows an estimated range up front, but the real price is the quote the technician prepares once they have seen the device - and you see it before anything is repaired.',
    },
    {
        question: 'Can I decline a quote?',
        answer: 'Yes. Approving a quote is a decision, not a payment. If you decline, the repair does not go ahead.',
    },
    {
        question: 'How do I track my repair?',
        answer: 'Every request gets a tracking code you can enter on the public tracking page, without signing in. That view deliberately hides personal details. Signed in, you can see the full record of your own requests.',
    },
    {
        question: 'How is a technician assigned?',
        answer: 'An administrator assigns a technician whose approved expertise and service area match your request. Technicians can only take work after their application has been reviewed and approved.',
    },
    {
        question: 'What happens once the repair is finished?',
        answer: 'The technician marks the repair complete and you confirm that the device is back in your hands. That confirmation is recorded against the request.',
    },
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
//
// Phase 2 folds the technician application into the primary nav rather than
// leaving it as a separate right-hand CTA. It carries `gate: 'technician'`
// because the existing rule hides it from accounts that are already a
// technician or an admin - see getPublicNavLinks below. Labels are unchanged:
// renaming user-facing copy is not part of this phase.
export const PUBLIC_NAV_LINKS = [
    { label: 'Home', to: '/', end: true },
    { label: 'Services', to: '/services' },
    { label: 'Track Repair', to: TRACK_REPAIR_ROUTE },
    { label: 'Service Areas', to: '/service-areas' },
    { label: 'About', to: '/about' },
    { label: 'Become a Technician', to: BECOME_TECHNICIAN_ROUTE, gate: 'technician' },
];

// The nav for a given auth state. VISIBILITY ONLY - route guards remain the
// access boundary, and a gated link is simply not offered to an account for
// whom it is redundant. Role is never guessed: while it is still resolving,
// shouldShowBecomeTechnicianLink returns false for a signed-in user, so the
// link appears once the role is actually known.
export function getPublicNavLinks({ user, role } = {}) {
    return PUBLIC_NAV_LINKS.filter((link) => (
        link.gate !== 'technician' || shouldShowBecomeTechnicianLink({ user, role })
    ));
}

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
