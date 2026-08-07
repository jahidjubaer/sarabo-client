import AdminOverview from '../../../components/admin/AdminOverview';

// Phase 7.5: the admin dashboard home now renders the redesigned operations
// overview (authoritative metrics, status/category charts, currency-safe
// payment summary). Thin page wrapper so the DashboardHome role dispatch is
// unchanged; presentation lives in components/admin/.
const AdminDashboardHome = () => <AdminOverview />;

export default AdminDashboardHome;
