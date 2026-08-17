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
    getPublicNavLinks, shouldShowCreateRequestLink,
    getRequestRepairAction, isPublicNavLinkActive,
} from '../../../utils/publicContent';
import { ROLE_SHORTCUTS } from './roleShortcuts';
import { cn } from '../../../lib/utils';

// Public site header (Phase 2, service-spine shell).
//
// AUTH BEHAVIOUR IS UNCHANGED. It reads useAuth/useRole exactly as before, the
// same links appear for the same auth states, logout calls the same function,
// and the route guards remain the only access boundary - nothing here grants
// or restricts anything. What changed is the frame: a calmer bar, one primary
// action, and an active state you can read at a glance.
//
// Marigold scarcity: the action colour appears exactly twice - the "Request a
// Repair" button, and the 2px rail under the current page. Everything else is
// ink, muted, or verdigris on hover. Register is an outline, Log in a ghost, so
// the three auth controls rank themselves without shouting.

// Desktop nav item. Active state is carried by THREE signals, never colour
// alone: heavier weight, the marigold rail, and aria-current="page".
function desktopLink(active) {
    return cn(
        'focus-ring relative inline-flex h-16 items-center px-3 text-body-sm transition-colors',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:content-[""]',
        active
            ? 'font-semibold text-ds-foreground after:bg-ds-action'
            : 'font-medium text-ds-muted-foreground after:bg-transparent hover:text-ds-foreground hover:after:bg-ds-border'
    );
}

// Mobile item. Same three signals, expressed for a stacked list: weight, a
// left rail, and aria-current.
function mobileLink(active) {
    return cn(
        'focus-ring flex min-h-11 items-center rounded-ds border-l-2 px-3 text-body-sm transition-colors',
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

    // Close the sheet on any route change (covers the Logo and back/forward),
    // adjusted during render per React's sanctioned reset pattern.
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (location.pathname !== prevPath) {
        setPrevPath(location.pathname);
        if (mobileOpen) setMobileOpen(false);
    }

    const roleKnown = !roleLoading && !isError;
    const roleShortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;
    const navLinks = getPublicNavLinks({ user, role });
    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <header className="sticky top-0 z-50 border-b border-ds-border bg-ds-background/95 backdrop-blur supports-[backdrop-filter]:bg-ds-background/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
                {/* Mobile trigger + brand */}
                <div className="flex items-center gap-1">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger
                            aria-label="Open main menu"
                            className="focus-ring inline-flex size-10 items-center justify-center rounded-ds text-ds-foreground hover:bg-ds-muted lg:hidden"
                        >
                            <Menu aria-hidden="true" className="size-5" />
                        </SheetTrigger>

                        {/* Radix Dialog under the hood: focus trap, Escape to
                            close, scroll lock, focus returned to the trigger,
                            and aria-expanded / aria-controls wired on the
                            trigger automatically. No new dependency. */}
                        <SheetContent side="left" className="w-[86%] max-w-xs">
                            <SheetHeader className="border-b border-ds-border">
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>

                            <nav aria-label="Primary" className="flex flex-col gap-1 overflow-y-auto p-4">
                                {navLinks.map((link) => {
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
                                {/* Action first: the primary action leads the
                                    block, before account controls and theme. */}
                                {showRequestCta && (
                                    <Link to={requestAction.to} className={buttonVariants({ variant: 'action' })} onClick={closeMobile}>
                                        {requestAction.label}
                                    </Link>
                                )}

                                {/* Account actions (Dashboard, Profile,
                                    Notifications, Sign out) now live in the
                                    avatar menu, which is present at every width -
                                    so the sheet no longer repeats them. Only the
                                    role workspace shortcut stays, because it is
                                    navigation rather than an account action and
                                    the avatar menu does not carry it. */}
                                {user ? (
                                    roleShortcut && (
                                        <Link to={roleShortcut.to} className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>
                                            {roleShortcut.label}
                                        </Link>
                                    )
                                ) : (
                                    <>
                                        <Link to="/register" className={buttonVariants({ variant: 'outline' })} onClick={closeMobile}>Register</Link>
                                        <Link to="/login" className={buttonVariants({ variant: 'ghost' })} onClick={closeMobile}>Log in</Link>
                                    </>
                                )}

                                <div className="mt-2 flex items-center justify-between border-t border-ds-border pt-3">
                                    <span className="ds-label text-ds-muted-foreground">Theme</span>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* The wordmark now lives inside the lockup artwork, so the
                        old `[&>span]` fold-away selector had nothing left to
                        target. Measured at 320px the full lockup is 80px wide
                        and still leaves 24px of clearance before the primary
                        action, so the bar keeps the complete brand at every
                        width rather than dropping to the symbol. */}
                    <Logo />
                </div>

                {/* Desktop primary navigation */}
                <nav aria-label="Primary" className="ml-4 hidden lg:block">
                    <ul className="flex items-center">
                        {navLinks.map((link) => {
                            const active = isPublicNavLinkActive(location.pathname, link);
                            return (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        aria-current={active ? 'page' : undefined}
                                        className={desktopLink(active)}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Right cluster - one action, everything else quiet */}
                <div className="ml-auto flex items-center gap-2">
                    {user && <NotificationBell />}
                    <div className="hidden lg:block"><ThemeToggle /></div>

                    {!user && (
                        <div className="hidden items-center gap-2 lg:flex">
                            {/* Register is the wider control, so it appears from
                                xl where there is room; below that it lives in
                                the mobile sheet and on the Log in page. */}
                            <Link to="/register" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden xl:inline-flex')}>
                                Register
                            </Link>
                            <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Log in</Link>
                        </div>
                    )}

                    {/* Signed out, the bar carries no bell or avatar, so the
                        action keeps its existing 320px slot. Signed in it would
                        crowd them, and the mobile sheet still leads with the
                        same action. */}
                    {showRequestCta && (
                        <Link
                            to={requestAction.to}
                            className={cn(buttonVariants({ variant: 'action', size: 'sm' }), user && 'hidden sm:inline-flex')}
                        >
                            {requestAction.label}
                        </Link>
                    )}

                    {/* The signed-in account control, at every width: the avatar
                        replaces the log-in action rather than sitting beside it,
                        and the two states are mutually exclusive. */}
                    {user && <AccountMenu role={roleKnown ? role : undefined} />}
                </div>
            </div>
        </header>
    );
};

export default NavBar;
