import {
    LayoutDashboard, PlusCircle, Wrench, CreditCard, ClipboardList, CheckCheck,
    UserCog, UserCheck, Users, Bell, User, Home, Wallet, Banknote,
} from 'lucide-react';

// Canonical, role-aware dashboard navigation (Phase 7.2). Single source of
// truth for the sidebar, the mobile sheet, and the command palette - no menu
// arrays scattered across components.
//
// VISIBILITY ONLY: the route guards (CustomerRoute/TechnicianRoute/AdminRoute
// in routes/) remain the authoritative authorization boundary. Hiding or
// showing a link here never grants or restricts access. Role comes from the
// server-derived useRole() truth, never from any client-editable value.
//
// Every `to` points at a real, existing route (see routes/router.jsx) - there
// are no placeholder destinations. `end: true` marks index-style routes so
// active matching does not light up for every nested path.

export const ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Admin' };

const CUSTOMER_SECTIONS = [
    {
        heading: 'Workspace',
        items: [
            { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
            { label: 'Create Request', to: '/dashboard/create-request', icon: PlusCircle },
            { label: 'My Requests', to: '/dashboard/my-requests', icon: Wrench },
            { label: 'Payment History', to: '/dashboard/payment-history', icon: CreditCard },
        ],
    },
];

const TECHNICIAN_SECTIONS = [
    {
        heading: 'Repair Work',
        items: [
            { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
            { label: 'Assigned Repairs', to: '/dashboard/assigned-jobs', icon: ClipboardList },
            { label: 'Completed Repairs', to: '/dashboard/completed-jobs', icon: CheckCheck },
            { label: 'Wallet', to: '/dashboard/wallet', icon: Wallet },
        ],
    },
];

const ADMIN_SECTIONS = [
    {
        heading: 'Operations',
        items: [
            { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
            { label: 'Repair Requests', to: '/dashboard/manage-repair-requests', icon: ClipboardList },
            { label: 'Assign Technicians', to: '/dashboard/assign-technicians', icon: UserCog },
            { label: 'Approve Technicians', to: '/dashboard/approve-technicians', icon: UserCheck },
            { label: 'Withdrawal Requests', to: '/dashboard/withdrawal-requests', icon: Banknote },
            { label: 'Users', to: '/dashboard/users-management', icon: Users },
        ],
    },
];

const SECTIONS_BY_ROLE = { user: CUSTOMER_SECTIONS, rider: TECHNICIAN_SECTIONS, admin: ADMIN_SECTIONS };

// Available to every authenticated role (not role-gated) - matches the existing
// dashboard behaviour: notifications and profile are open to user/rider/admin.
// `badge: 'notifications'` marks the ONE nav item allowed to show a count. It
// is a presentation flag only - the destination, icon and label are unchanged -
// and it resolves against the unread-count query the header already runs, so it
// adds no request, no query key and no endpoint. No other item carries a badge,
// because no other count exists without new fetching.
export const ACCOUNT_SECTION = {
    heading: 'Account',
    items: [
        { label: 'Notifications', to: '/dashboard/notifications', icon: Bell, badge: 'notifications' },
        { label: 'Profile', to: '/dashboard/profile', icon: User },
    ],
};

// Link back to the public site, offered for all roles.
export const HOME_ITEM = { label: 'Home page', to: '/', icon: Home, end: true };

// Role sections + the shared account section. An unknown/loading role yields
// just the account section (mirrors the old shell hiding role links until the
// role resolves).
export function getNavSections(role) {
    const roleSections = SECTIONS_BY_ROLE[role] || [];
    return [...roleSections, ACCOUNT_SECTION];
}

// Flat destination list for the command palette (role sections + account +
// home). Each item keeps its section heading as `group`.
export function getCommandDestinations(role) {
    const sections = getNavSections(role);
    const items = sections.flatMap((section) => section.items.map((item) => ({ ...item, group: section.heading })));
    items.push({ ...HOME_ITEM, group: 'General' });
    return items;
}

// ---- Breadcrumb labels ----
// Human labels for the known dashboard path segments. A dynamic :id segment (a
// Mongo id) is never shown raw - it collapses to DYNAMIC_SEGMENT_LABEL. No API
// call is made for breadcrumb text in this unit.
export const SEGMENT_LABELS = {
    dashboard: 'Dashboard',
    'create-request': 'Create Request',
    'my-requests': 'My Requests',
    'payment-history': 'Payment History',
    'assigned-jobs': 'Assigned Jobs',
    'completed-jobs': 'Completed Repairs',
    'manage-repair-requests': 'Repair Requests',
    'assign-technicians': 'Assign Technicians',
    'approve-technicians': 'Approve Technicians',
    'users-management': 'Users',
    wallet: 'Wallet',
    'withdrawal-requests': 'Withdrawal Requests',
    notifications: 'Notifications',
    profile: 'Profile',
    payment: 'Payment',
    'payment-success': 'Payment',
    'payment-cancelled': 'Payment',
};

export const DYNAMIC_SEGMENT_LABEL = 'Details';
