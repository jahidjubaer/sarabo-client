import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import Logo from '../../../components/Logo/Logo';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import NotificationBell from '../../../components/notifications/NotificationBell';
import AccountMenu from '../../../components/public/AccountMenu';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet';
import { buttonVariants } from '../../../components/ui/button-variants';
import {
    PUBLIC_NAV_LINKS, shouldShowCreateRequestLink, getRequestRepairAction, isPublicNavLinkActive,
} from '../../../utils/publicContent';
import { ROLE_SHORTCUTS } from './roleShortcuts';
import { cn } from '../../../lib/utils';

// Public site header (redesign Phase 2).
//
// Four destinations, Sign in, and one action. That is what lets the full bar
// return at lg (1024px) - the previous bar carried six links, Register, Log in,
// the theme toggle and the action, and only fitted from 1280px, so common
// laptops got a hamburger. Register lives on the sign-in page and in the menu
// sheet; "Become a technician" lives in the footer and the account menu.
//
// AUTH IS UNCHANGED: it reads useAuth/useRole as before, logout is the same
// call, and route guards remain the only access boundary.
//
// Active state uses three signals, never colour alone: weight, the marigold
// rail, and aria-current="page".
function desktopLink(active) {
    return cn(
        'focus-ring relative inline-flex h-16 items-center whitespace-nowrap px-3 text-body-sm transition-colors',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:content-[""]',
        active
            ? 'font-semibold text-ds-foreground after:bg-ds-action'
            : 'font-medium text-ds-muted-foreground after:bg-transparent hover:text-ds-foreground hover:after:bg-ds-border'
    );
}

function mobileLink(active) {
    return cn(
        'focus-ring flex min-h-12 items-center rounded-ds border-l-2 px-3 text-body transition-colors',
        active
            ? 'border-l-ds-action bg-ds-muted font-semibold text-ds-foreground'
            : 'border-l-transparent font-medium text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground'
    );
}

const NavBar = () => {
    const { user } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    // Close the sheet on any route change (covers the logo and back/forward),
    // adjusted during render per React's sanctioned reset pattern.
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (location.pathname !== prevPath) {
        setPrevPath(location.pathname);
        if (mobileOpen) setMobileOpen(false);
    }

    const roleKnown = !roleLoading && !isError;
    const roleShortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;
    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <header className="sticky top-0 z-50 border-b border-ds-border bg-ds-background/95 backdrop-blur supports-[backdrop-filter]:bg-ds-background/85">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger
                            aria-label="Open main menu"
                            className="focus-ring -ml-2 inline-flex size-11 items-center justify-center rounded-ds text-ds-foreground hover:bg-ds-muted lg:hidden"
                        >
                            <Menu aria-hidden="true" className="size-6" />
                        </SheetTrigger>

                        <SheetContent side="left" className="w-[86%] max-w-xs">
                            <SheetHeader className="border-b border-ds-border">
                                <SheetTitle className="flex items-center">
                                    <Logo onClick={closeMobile} />
                                </SheetTitle>
                            </SheetHeader>

                            <nav aria-label="Primary" className="flex flex-col gap-1 overflow-y-auto p-4">
                                <Link to="/" aria-current={location.pathname === '/' ? 'page' : undefined} className={mobileLink(location.pathname === '/')} onClick={closeMobile}>
                                    Home
                                </Link>
                                {PUBLIC_NAV_LINKS.map((link) => {
                                    const active = isPublicNavLinkActive(location.pathname, link);
                                    return (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            aria-current={active ? 'page' : undefined}
                                            className={mobileLink(active)}
                                            onClick={closeMobile}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto flex flex-col gap-2 border-t border-ds-border p-4">
                                {showRequestCta && (
                                    <Link to={requestAction.to} className={buttonVariants({ variant: 'action', size: 'lg' })} onClick={closeMobile}>
                                        {requestAction.label}
                                    </Link>
                                )}
                                {user ? (
                                    roleShortcut && (
                                        <Link to={roleShortcut.to} className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>
                                            {roleShortcut.label}
                                        </Link>
                                    )
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link to="/login" className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>Sign in</Link>
                                        <Link to="/register" className={buttonVariants({ variant: 'ghost' })} onClick={closeMobile}>Create account</Link>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between border-t border-ds-border pt-3">
                                    <span className="text-body-sm font-semibold text-ds-muted-foreground">Theme</span>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Logo />
                </div>

                <nav aria-label="Primary" className="ml-4 hidden lg:block">
                    <ul className="flex items-center">
                        {PUBLIC_NAV_LINKS.map((link) => {
                            const active = isPublicNavLinkActive(location.pathname, link);
                            return (
                                <li key={link.to}>
                                    <Link to={link.to} aria-current={active ? 'page' : undefined} className={desktopLink(active)}>
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    {user && <NotificationBell />}
                    <div className="hidden lg:block"><ThemeToggle /></div>

                    {!user && (
                        <Link to="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
                            Sign in
                        </Link>
                    )}

                    {showRequestCta && (
                        <Link to={requestAction.to} aria-label={requestAction.label} className={buttonVariants({ variant: 'action', size: 'sm' })}>
                            <span className="sm:hidden">Request</span>
                            <span className="hidden sm:inline">{requestAction.label}</span>
                        </Link>
                    )}

                    {user && <AccountMenu role={roleKnown ? role : undefined} />}
                </div>
            </div>
        </header>
    );
};

export default NavBar;
