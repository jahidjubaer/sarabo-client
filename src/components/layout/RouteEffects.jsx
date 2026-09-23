import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { getRouteTitle } from '../../config/dashboardNavigation';

// Runs on every route change (pathname only - query-string filter changes and
// in-page #hash links are not navigations):
//   1. sets document.title to "<page> · Sarabo";
//   2. moves keyboard focus to the new page's h1 (PageHeader renders
//      #page-title), falling back to the layout's <main>, so keyboard and
//      screen-reader users start at the new content instead of the old link;
//   3. announces the new page title through a polite live region.
// The first render is skipped so a fresh load keeps the browser's default
// focus. Scroll position is handled by <ScrollRestoration /> alongside.
const FOCUS_TARGETS = ['#page-title', '#dashboard-main', '#main-content'];

function RouteEffects() {
    const { pathname } = useLocation();
    const firstRender = useRef(true);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const title = getRouteTitle(pathname);
        document.title = title ? `${title} · Sarabo` : 'Sarabo';

        if (firstRender.current) {
            firstRender.current = false;
            return undefined;
        }

        // Wait a frame so the new route has rendered its heading.
        const frame = requestAnimationFrame(() => {
            const target = FOCUS_TARGETS.map((selector) => document.querySelector(selector)).find(Boolean);
            target?.focus({ preventScroll: true });
            setAnnouncement(title ? `${title} page` : 'Page loaded');
        });
        return () => cancelAnimationFrame(frame);
    }, [pathname]);

    return (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
        </div>
    );
}

export { RouteEffects };
