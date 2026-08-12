import { Link } from 'react-router';
import { Home } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import Logo from '../Logo/Logo';
import { DashboardNavLinks } from './DashboardNavLinks';
import { getNavSections, ROLE_LABELS } from '../../config/dashboardNavigation';

// Mobile navigation: a left-side Sheet (Radix Dialog) replacing the desktop
// sidebar below lg. Real focus trapping / Escape / scroll-lock come from the
// Sheet primitive. Selecting any destination closes the sheet (onNavigate).
function MobileDashboardNav({ role, open, onOpenChange }) {
    const sections = getNavSections(role);
    const close = () => onOpenChange(false);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="gap-0">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle className="flex items-center">
                        <Logo to="/dashboard" ariaLabel="Sarabo dashboard" onClick={close} />
                    </SheetTitle>
                    {role && <p className="text-xs text-ds-muted-foreground">{ROLE_LABELS[role]} workspace</p>}
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <DashboardNavLinks sections={sections} onNavigate={close} />
                </div>
                <div className="mt-auto border-t border-ds-border p-3">
                    <Link
                        to="/"
                        onClick={close}
                        className="focus-ring flex min-h-11 items-center gap-2 rounded-ds px-3 text-sm font-medium text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground"
                    >
                        <Home className="size-5 shrink-0" aria-hidden="true" /> Back to Sarabo
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export { MobileDashboardNav };
