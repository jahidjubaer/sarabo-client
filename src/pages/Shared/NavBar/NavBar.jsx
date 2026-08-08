import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, LayoutDashboard, LogOut, Wrench } from 'lucide-react';
import Logo from '../../../components/Logo/Logo';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import NotificationBell from '../../../components/notifications/NotificationBell';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet';
import { buttonVariants } from '../../../components/ui/button-variants';
import {
    PUBLIC_NAV_LINKS, shouldShowCreateRequestLink, shouldShowBecomeTechnicianLink,
    getRequestRepairAction, isPublicNavLinkActive, BECOME_TECHNICIAN_ROUTE,
} from '../../../utils/publicContent';
import { ROLE_SHORTCUTS } from './roleShortcuts';
import { cn } from '../../../lib/utils';

// Public site header (Phase 7.10). ds-* only (no DaisyUI): a pill nav group
// with an active "aura" (shape + weight + tint + ring, never colour alone),
// a Radix Sheet mobile menu, the shared ThemeToggle (single ThemeProvider -
// no second store), and a role-safe Become-a-Technician CTA. Auth behavior is
// unchanged - it reads useAuth/useRole exactly as before; route guards remain
// the access boundary. Active matching uses the exact/path-aware helper so
// "Home" (/) never lights up on every route.
function desktopPill(active) {
    return cn(
        'focus-ring rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
        active
            ? 'bg-ds-primary/10 text-ds-primary font-semibold ring-1 ring-ds-primary/30'
            : 'text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground'
    );
}

function mobilePill(active) {
    return cn(
        'focus-ring flex min-h-11 items-center rounded-ds px-3 text-sm font-medium',
        active ? 'bg-ds-primary/10 text-ds-primary font-semibold' : 'text-ds-foreground hover:bg-ds-muted'
    );
}

const NavBar = () => {
    const { user, logOut } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    // Close the sheet on any route change (covers the Logo and back/forward),
    // adjusted during render per React's sanctioned reset pattern.
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (location.pathname !== prevPath) {
        setPrevPath(location.pathname);
        if (mobileOpen) setMobileOpen(false);
    }

    const handleLogOut = () => {
        logOut().catch((error) => {
            if (import.meta.env.DEV) console.error('Logout failed:', error.message);
        });
    };

    const roleKnown = !roleLoading && !isError;
    const roleShortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;
    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const showTechnicianCta = shouldShowBecomeTechnicianLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <header className="sticky top-0 z-50 border-b border-ds-border bg-ds-background/95 backdrop-blur supports-[backdrop-filter]:bg-ds-background/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                {/* Brand + mobile trigger */}
                <div className="flex items-center gap-1">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger
                            aria-label="Open menu"
                            className="focus-ring inline-flex size-10 items-center justify-center rounded-ds text-ds-foreground hover:bg-ds-muted lg:hidden"
                        >
                            <Menu aria-hidden="true" className="size-5" />
                        </SheetTrigger>
                        <SheetContent side="left" className="w-4/5 max-w-sm">
                            <SheetHeader className="border-b border-ds-border">
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 p-4">
                                {PUBLIC_NAV_LINKS.map((link) => {
                                    const active = isPublicNavLinkActive(location.pathname, link);
                                    return (
                                        <Link key={link.to} to={link.to} aria-current={active ? 'page' : undefined} className={mobilePill(active)} onClick={closeMobile}>
                                            {link.label}
                                        </Link>
                                    );
                                })}
                                {showRequestCta && (
                                    <Link to={requestAction.to} className={mobilePill(false)} onClick={closeMobile}>{requestAction.label}</Link>
                                )}
                                {showTechnicianCta && (
                                    <Link to={BECOME_TECHNICIAN_ROUTE} className={mobilePill(false)} onClick={closeMobile}>Become a Technician</Link>
                                )}
                            </nav>
                            <div className="mt-auto border-t border-ds-border p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm text-ds-muted-foreground">Theme</span>
                                    <ThemeToggle />
                                </div>
                                {user ? (
                                    <div className="flex flex-col gap-2">
                                        <Link to="/dashboard" className={buttonVariants({ variant: 'default' })} onClick={closeMobile}>
                                            <LayoutDashboard aria-hidden="true" /> Dashboard
                                        </Link>
                                        {roleShortcut && (
                                            <Link to={roleShortcut.to} className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>
                                                {roleShortcut.label}
                                            </Link>
                                        )}
                                        <Link to="/dashboard/profile" className={buttonVariants({ variant: 'ghost' })} onClick={closeMobile}>My Profile</Link>
                                        <button
                                            type="button"
                                            onClick={() => { closeMobile(); handleLogOut(); }}
                                            className={cn(buttonVariants({ variant: 'ghost' }), 'text-ds-destructive')}
                                        >
                                            <LogOut aria-hidden="true" /> Log out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link to="/login" className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>Log in</Link>
                                        <Link to="/register" className={buttonVariants({ variant: 'default' })} onClick={closeMobile}>Register</Link>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Logo />
                </div>

                {/* Desktop nav pill group */}
                <nav aria-label="Primary" className="hidden lg:block">
                    <ul className="flex items-center gap-1 rounded-full border border-ds-border bg-ds-card/60 p-1">
                        {PUBLIC_NAV_LINKS.map((link) => {
                            const active = isPublicNavLinkActive(location.pathname, link);
                            return (
                                <li key={link.to}>
                                    <Link to={link.to} aria-current={active ? 'page' : undefined} className={desktopPill(active)}>{link.label}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Right cluster */}
                <div className="flex items-center gap-2">
                    {user && <NotificationBell />}
                    <div className="hidden lg:block"><ThemeToggle /></div>
                    {showTechnicianCta && (
                        <Link to={BECOME_TECHNICIAN_ROUTE} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden xl:inline-flex')}>
                            <Wrench aria-hidden="true" /> Become a Technician
                        </Link>
                    )}
                    {showRequestCta && (
                        <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'hidden sm:inline-flex')}>
                            {requestAction.label}
                        </Link>
                    )}
                    <div className="hidden items-center gap-2 lg:flex">
                        {user ? (
                            <>
                                <Link to="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                    <LayoutDashboard aria-hidden="true" /> Dashboard
                                </Link>
                                <button type="button" onClick={handleLogOut} aria-label="Log out" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-ds-muted-foreground hover:text-ds-destructive')}>
                                    <LogOut aria-hidden="true" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Log in</Link>
                                <Link to="/register" className={buttonVariants({ variant: 'default', size: 'sm' })}>Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default NavBar;
