import CustomerOverview from '../../../components/customer/CustomerOverview';

// Phase 7.3: the customer dashboard home now renders the redesigned overview
// (repair-focused summary, active-repair snapshot, recent requests, quick
// actions). Kept as a thin page wrapper so the DashboardHome role dispatch is
// unchanged; all presentation lives in components/customer/.
const CustomerDashboardHome = () => <CustomerOverview />;

export default CustomerDashboardHome;
