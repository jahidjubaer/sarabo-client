import DashboardShell from '../components/layout/DashboardShell';

// Phase 7.2: the dashboard layout now renders the redesigned app shell
// (sidebar + header + mobile sheet + command palette). Kept as a thin wrapper
// so routes/router.jsx keeps importing DashboardLayout unchanged - route
// semantics are untouched; only the shell chrome around <Outlet/> changed.
const DashboardLayout = () => <DashboardShell />;

export default DashboardLayout;
