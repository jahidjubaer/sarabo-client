import { Link } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
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
                    <SheetTitle asChild>
                        <Link to="/dashboard" onClick={close} className="focus-ring flex items-center gap-2 rounded-ds">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-ds bg-ds-primary text-sm font-bold text-ds-primary-foreground">S</span>
                            <span className="text-base text-ds-foreground">Sarabo</span>
                        </Link>
                    </SheetTitle>
                    {role && <p className="text-xs text-ds-muted-foreground">{ROLE_LABELS[role]} workspace</p>}
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <DashboardNavLinks sections={sections} onNavigate={close} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

export { MobileDashboardNav };
