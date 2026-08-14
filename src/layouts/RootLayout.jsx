import { Outlet } from 'react-router';
import Footer from '../pages/Shared/Footer/Footer';
import NavBar from '../pages/Shared/NavBar/NavBar';

// Public site shell (Phase 7.8, reframed in Phase 2).
//
// The outer wrapper paints the theme-reactive ds-* background/foreground across
// the whole public area so dark mode is coherent edge-to-edge. NavBar and
// Footer are full-bleed with their own internal max-width; only the routed
// content is centred, and its max-width is unchanged so no existing page
// reflows before its own phase.
//
// Phase 2 adds one thing: a skip link. With six primary nav items plus an
// action cluster, a keyboard or screen-reader user otherwise tabs the entire
// header on every page before reaching content. It is invisible until focused.
const RootLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-ds-background text-ds-foreground">
            <a
                href="#main-content"
                className="focus-ring sr-only z-[60] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:inline-flex focus:h-10 focus:items-center focus:rounded-ds focus:bg-ds-action focus:px-4 focus:text-body-sm focus:font-semibold focus:text-ds-action-foreground"
            >
                Skip to content
            </a>
            <NavBar />
            <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default RootLayout;
