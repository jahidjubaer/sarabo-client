import { Outlet } from 'react-router';
import Footer from '../pages/Shared/Footer/Footer';
import NavBar from '../pages/Shared/NavBar/NavBar';

// Public site shell (Phase 7.8). The outer wrapper paints the theme-reactive
// ds-* background/foreground across the whole public area so dark mode is
// coherent edge-to-edge (previously the max-w container left the page a light
// island in dark mode). NavBar and Footer are full-bleed with their own
// internal max-width; only the routed content is centred.
const RootLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-ds-background text-ds-foreground">
            <NavBar />
            <main className="mx-auto w-full max-w-7xl flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default RootLayout;
