import { Menu, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import NotificationBell from '../notifications/NotificationBell';
import useAuth from '../../hooks/useAuth';

// Compact sticky dashboard header. Left: mobile menu trigger (hidden on lg,
// where the sidebar is present) + route breadcrumb context. Right: a command
// trigger (labelled on >=sm, icon-only below), the existing NotificationBell
// (integrated as-is - no invented counts), the theme toggle, and the user menu.
//
// Phase 7 restyles only: no control was added or removed, and nothing here
// reports a metric. NotificationBell is left exactly as it is - it belongs to
// Phase 12 (notifications), so restyling it now would reach outside this phase.
function DashboardHeader({ role, onOpenMobileNav, onOpenCommand, mobileNavOpen = false }) {
    const { user } = useAuth();
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ds-border bg-ds-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-ds-background/80 sm:px-4">
            {/* Phase 13A-2: measured at 375px with the sheet genuinely open, this
                trigger reported aria-expanded = null. The public navbar's trigger
                is a Radix SheetTrigger, which sets the attribute itself; this one
                is a plain Button driven by shell state, so it has to say so. The
                sheet's own id is Radix-generated, so aria-expanded alone carries
                the state - no aria-controls guess. */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation menu" aria-expanded={mobileNavOpen}>
                <Menu className="size-5" aria-hidden="true" />
            </Button>

            <div className="min-w-0 flex-1">
                <Breadcrumbs />
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCommand}
                    className="hidden gap-2 text-ds-muted-foreground sm:inline-flex"
                    aria-label="Open command menu"
                >
                    <Search className="size-4" aria-hidden="true" />
                    <span className="text-body-sm">Search</span>
                    <kbd className="ds-numeric ml-1 rounded-ds-sm border border-ds-border px-1 text-micro leading-4">⌘K</kbd>
                </Button>
                <Button variant="ghost" size="icon" onClick={onOpenCommand} className="sm:hidden" aria-label="Open command menu">
                    <Search className="size-5" aria-hidden="true" />
                </Button>

                {user && <NotificationBell />}
                <ThemeToggle />
                <UserMenu role={role} />
            </div>
        </header>
    );
}

export { DashboardHeader };
