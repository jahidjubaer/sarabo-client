import { Outlet, ScrollRestoration } from 'react-router';
import SupportWidget from '../components/support/SupportWidget';
import SaraboTour from '../components/tour/SaraboTour';
import { RouteEffects } from '../components/layout/RouteEffects';

function ApplicationLayout() {
    return (
        <>
            <Outlet />
            <ScrollRestoration />
            <RouteEffects />
            <SaraboTour />
            <SupportWidget />
        </>
    );
}

export default ApplicationLayout;
