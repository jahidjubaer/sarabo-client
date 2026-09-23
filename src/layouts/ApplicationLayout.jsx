import { Outlet } from 'react-router';
import SupportWidget from '../components/support/SupportWidget';
import SaraboTour from '../components/tour/SaraboTour';

function ApplicationLayout() {
    return (
        <>
            <Outlet />
            <SaraboTour />
            <SupportWidget />
        </>
    );
}

export default ApplicationLayout;
