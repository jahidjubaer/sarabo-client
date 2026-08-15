import { Link } from 'react-router';
import { Home } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import Logo from '../Logo/Logo';
import { DashboardNavLinks } from './DashboardNavLinks';
import { getNavSections, ROLE_LABELS } from '../../config/dashboardNavigation';

// Mobile navigation: a left-side Sheet (Radix Dialog) replacing the desktop
// sidebar below lg. Real focus trapping / Escape / scroll-lock / focus
// restoration come from the Sheet primitive - none of that is reimplemented
// here. Selecting any destination closes the sheet (onNavigate).
//
// Phase 7: the panel is the same INK surface as the desktop rail and renders
// the same DashboardNavLinks from the same getNavSections(role), so the two
// navigations can never disagree. The sheet is 4/5 width capped at max-w-xs,
// which keeps it inside a 320px viewport.
function MobileDashboardNav({ role, open, onOpenChange }) {
    const sections = getNavSections(role);
    const close = () => onOpenChange(false);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="gap-0 border-ds-ink-foreground/15 bg-ds-ink text-ds-ink-foreground"
            >
                <SheetHeader className="border-b border-ds-ink-foreground/15">
                    <SheetTitle className="flex items-center text-ds-ink-foreground">
                        <Logo to="/dashboard" ariaLabel="Sarabo dashboard" onClick={close} />
                    </SheetTitle>
                    {role && (
                        <p className="ds-label text-ds-ink-foreground/50">{ROLE_LABELS[role]} workspace</p>
                    )}
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <DashboardNavLinks sections={sections} onNavigate={close} />
                </div>

                <div className="mt-auto border-t border-ds-ink-foreground/15 p-3">
                    <Link
                        to="/"
                        onClick={close}
                        className="focus-ring flex min-h-11 items-center gap-2 rounded-ds px-3 text-body-sm font-medium text-ds-ink-foreground/65 transition-colors hover:bg-ds-ink-foreground/10 hover:text-ds-ink-foreground"
                    >
                        <Home className="size-5 shrink-0" aria-hidden="true" /> Back to Sarabo
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export { MobileDashboardNav };
