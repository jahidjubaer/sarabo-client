// Single source of truth for the role-aware Navbar shortcut, shared by
// ProfileDropdown (desktop) and NavBar's mobile drawer so both surfaces
// agree on label/route/role string. Split into its own module (rather than
// living in ProfileDropdown.jsx) so that file can stay component-only for
// React Fast Refresh.
export const ROLE_SHORTCUTS = {
    user: { label: 'My Repair Requests', to: '/dashboard/my-requests' },
    rider: { label: 'Assigned Repairs', to: '/dashboard/assigned-jobs' },
    admin: { label: 'Manage Repair Requests', to: '/dashboard/manage-repair-requests' },
};

export const ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Admin' };
