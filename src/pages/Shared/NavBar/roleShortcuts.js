// Single source of truth for the role-aware navbar shortcut, used by the
// public NavBar (desktop cluster + mobile sheet) and the Profile RoleContextCard
// so they agree on the label/route/role string for each role. Kept in its own
// module so consumers stay component-only for React Fast Refresh.
export const ROLE_SHORTCUTS = {
    user: { label: 'My Repair Requests', to: '/dashboard/my-requests' },
    rider: { label: 'Assigned Repairs', to: '/dashboard/assigned-jobs' },
    admin: { label: 'Manage Repair Requests', to: '/dashboard/manage-repair-requests' },
};
