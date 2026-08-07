import TechnicianOverview from '../../../components/technician/TechnicianOverview';

// Phase 7.4: the technician dashboard home now renders the redesigned work
// overview (counts, current job, recent jobs). Thin page wrapper so the
// DashboardHome role dispatch is unchanged; presentation lives in
// components/technician/.
const TechnicianDashboardHome = () => <TechnicianOverview />;

export default TechnicianDashboardHome;
