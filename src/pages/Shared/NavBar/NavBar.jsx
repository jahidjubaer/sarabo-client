import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Menu, LayoutDashboard, LogOut } from 'lucide-react';
import Logo from '../../../components/Logo/Logo';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import NotificationBell from '../../../components/notifications/NotificationBell';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet';
import { buttonVariants } from '../../../components/ui/button-variants';
import { PUBLIC_NAV_LINKS, shouldShowCreateRequestLink, getRequestRepairAction } from '../../../utils/publicContent';
import { ROLE_SHORTCUTS } from './roleShortcuts';
import { cn } from '../../../lib/utils';

// Public site header (Phase 7.8), redesigned to ds-* with a Radix Sheet mobile
// menu (real focus trap + Escape + scroll-lock). Auth behavior is unchanged -
// it reads useAuth/useRole exactly as before and never rewrites authentication;
// route guards remain the access boundary for every destination. Active state
// is conveyed by colour + weight + a bottom indicator together (not colour
// alone). The former DaisyUI navbar + ProfileDropdown are retired; the
// logged-in cluster now shows Dashboard/role-shortcut/Log out actions in ds-*
// rather than exposing avatar/email on the public bar.
const navLinkClass = ({ isActive }) =>
    cn(
        'focus-ring rounded-ds border-b-2 px-1 py-1 text-sm font-medium transition-colors',
        isActive
            ? 'border-ds-primary text-ds-primary font-semibold'
            : 'border-transparent text-ds-muted-foreground hover:text-ds-foreground'
    );

const mobileLinkClass = ({ isActive }) =>
    cn(
        'focus-ring flex min-h-11 items-center rounded-ds px-3 text-sm font-medium',
        isActive ? 'bg-ds-primary/10 text-ds-primary' : 'text-ds-foreground hover:bg-ds-muted'
    );

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
    const requestAction = getRequestRepairAction();

    const desktopLinks = PUBLIC_NAV_LINKS.map((link) => (
        <li key={link.to}>
            <NavLink end={link.end} to={link.to} className={navLinkClass}>{link.label}</NavLink>
        </li>
    ));

    const mobileLinks = PUBLIC_NAV_LINKS.map((link) => (
        <NavLink key={link.to} end={link.end} to={link.to} className={mobileLinkClass} onClick={closeMobile}>{link.label}</NavLink>
    ));

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
                                {mobileLinks}
                                {showRequestCta && (
                                    <NavLink to={requestAction.to} className={mobileLinkClass} onClick={closeMobile}>
                                        {requestAction.label}
                                    </NavLink>
                                )}
                                <NavLink to="/become-technician" className={mobileLinkClass} onClick={closeMobile}>Become a Technician</NavLink>
                            </nav>
                            <div className="mt-auto border-t border-ds-border p-4">
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

                {/* Desktop nav */}
                <nav className="hidden lg:block">
                    <ul className="flex items-center gap-4">{desktopLinks}</ul>
                </nav>

                {/* Right cluster */}
                <div className="flex items-center gap-2">
                    {user && <NotificationBell />}
                    {showRequestCta && (
                        <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'hidden sm:inline-flex')}>
                            {requestAction.label}
                        </Link>
                    )}
                    <div className="hidden items-center gap-2 lg:flex">
                        {user ? (
                            <>
                                {roleShortcut && (
                                    <Link to={roleShortcut.to} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{roleShortcut.label}</Link>
                                )}
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
