import { lazy, Suspense, useState } from 'react';
import { ScrollRestoration, useLocation } from 'react-router';
import SupportWidget from '../components/support/SupportWidget';
import { RouteEffects } from '../components/layout/RouteEffects';
import { RouteSuspense } from '../components/layout/RouteSuspense';

// The product tour (and react-joyride with it) is only downloaded once a
// ?tour=start link has been followed - the only way the tour ever starts.
// After that it stays mounted, so its own state and clean-up keep working.
const SaraboTour = lazy(() => import('../components/tour/SaraboTour'));

function ApplicationLayout() {
    const location = useLocation();
    const [tourLoaded, setTourLoaded] = useState(false);
    if (!tourLoaded && new URLSearchParams(location.search).get('tour') === 'start') {
        setTourLoaded(true);
    }

    return (
        <>
            <RouteSuspense />
            <ScrollRestoration />
            <RouteEffects />
            {tourLoaded && (
                <Suspense fallback={null}>
                    <SaraboTour />
                </Suspense>
            )}
            <SupportWidget />
        </>
    );
}

export default ApplicationLayout;
