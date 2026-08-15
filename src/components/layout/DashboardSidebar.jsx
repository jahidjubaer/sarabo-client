import { Link } from 'react-router';
import { PanelLeft, PanelLeftClose, Home } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import Logo from '../Logo/Logo';
import { DashboardNavLinks } from './DashboardNavLinks';
import { getNavSections, ROLE_LABELS } from '../../config/dashboardNavigation';
import { cn } from '../../lib/utils';

// Desktop-only collapsible sidebar (hidden below lg, where the mobile Sheet
// takes over). Sticky full-height rail: 256px expanded, 64px collapsed icon
// rail - both widths unchanged from before. Collapse is user-controlled and its
// preference is persisted by the shell. Keyboard accessible throughout (links +
// the collapse toggle are real focusable controls with labels).
//
// Phase 7: the rail is now the petrol INK surface, the same brand surface as
// the public footer, the auth panel and the how-it-works band - so the
// dashboard reads as the same product. It keeps an explicit right border,
// because in the dark palette `--ds-ink` and `--ds-background` are the same
// colour by design and the rail would otherwise dissolve into the page.
function DashboardSidebar({ role, collapsed, onToggleCollapse }) {
    const sections = getNavSections(role);
    const roleLabel = role ? ROLE_LABELS[role] : null;

    const collapseButton = (
        <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className={cn(
                'focus-ring flex items-center rounded-ds text-ds-ink-foreground/65 transition-colors hover:bg-ds-ink-foreground/10 hover:text-ds-ink-foreground',
                collapsed ? 'size-9 justify-center' : 'w-full gap-2 px-3 py-2'
            )}
        >
            {collapsed
                ? <PanelLeft className="size-5 shrink-0" aria-hidden="true" />
                : <PanelLeftClose className="size-5 shrink-0" aria-hidden="true" />}
            {!collapsed && <span className="text-body-sm font-medium">Collapse</span>}
        </button>
    );

    return (
        <aside
            aria-label="Dashboard navigation"
            className={cn(
                'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-ds-ink-foreground/15 bg-ds-ink text-ds-ink-foreground transition-[width] duration-200 lg:flex',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            <div className={cn(
                'flex h-14 shrink-0 items-center border-b border-ds-ink-foreground/15',
                collapsed ? 'justify-center px-0' : 'px-4'
            )}>
                <Logo to="/dashboard" ariaLabel="Sarabo dashboard" showWordmark={!collapsed} />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
                <DashboardNavLinks sections={sections} collapsed={collapsed} />
            </div>

            <div className={cn(
                'shrink-0 border-t border-ds-ink-foreground/15 p-3',
                collapsed && 'flex flex-col items-center gap-1'
            )}>
                {!collapsed && roleLabel && (
                    <p className="mb-3 px-3 text-micro text-ds-ink-foreground/50">
                        Signed in as <span className="font-semibold text-ds-ink-foreground/80">{roleLabel}</span>
                    </p>
                )}

                <Link
                    to="/"
                    aria-label="Back to Sarabo public site"
                    className={cn(
                        'focus-ring flex items-center rounded-ds text-ds-ink-foreground/65 transition-colors hover:bg-ds-ink-foreground/10 hover:text-ds-ink-foreground',
                        collapsed ? 'size-9 justify-center' : 'mb-1 w-full gap-2 px-3 py-2'
                    )}
                >
                    <Home className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="text-body-sm font-medium">Back to Sarabo</span>}
                </Link>

                {/* Collapsed, both controls are icon-only, so the toggle gets the
                    same Tooltip treatment the nav items already use. */}
                {collapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>{collapseButton}</TooltipTrigger>
                        <TooltipContent side="right">Expand sidebar</TooltipContent>
                    </Tooltip>
                ) : collapseButton}
            </div>
        </aside>
    );
}

export { DashboardSidebar };
