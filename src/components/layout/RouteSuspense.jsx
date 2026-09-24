import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Loading from '../Loading/Loading';

// A layout's <Outlet/> inside a Suspense boundary (redesign Phase 6). Pages
// are loaded on first visit (see routes/Router.jsx); while one is loading, the
// layout around it stays on screen and this shows a small loading state in
// the page area.
function RouteSuspense() {
    return (
        <Suspense fallback={<Loading />}>
            <Outlet />
        </Suspense>
    );
}

export { RouteSuspense };
