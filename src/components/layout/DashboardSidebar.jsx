import { Link } from 'react-router';
import { PanelLeft, PanelLeftClose, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardNavLinks } from './DashboardNavLinks';
import { getNavSections, ROLE_LABELS } from '../../config/dashboardNavigation';
import { cn } from '../../lib/utils';

// Desktop-only collapsible sidebar (hidden below lg, where the mobile Sheet
// takes over). Sticky full-height rail: ~256px expanded, ~64px collapsed icon
// rail. Collapse is user-controlled and its preference is persisted by the
// shell. Keyboard accessible throughout (links + the collapse toggle are real
// focusable controls with labels).
function DashboardSidebar({ role, collapsed, onToggleCollapse }) {
    const sections = getNavSections(role);
    return (
        <aside
            className={cn(
                "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-ds-border bg-ds-card transition-[width] duration-200 lg:flex",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div className={cn("flex h-14 items-center border-b border-ds-border", collapsed ? "justify-center px-0" : "px-4")}>
                <Link to="/dashboard" aria-label="Sarabo dashboard" className="focus-ring flex items-center gap-2 rounded-ds font-semibold">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-ds bg-ds-primary text-sm font-bold text-ds-primary-foreground">S</span>
                    {!collapsed && <span className="text-base text-ds-foreground">Sarabo</span>}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
                <DashboardNavLinks sections={sections} collapsed={collapsed} />
            </div>

            <div className={cn("border-t border-ds-border p-3", collapsed && "flex flex-col items-center gap-1")}>
                <Link
                    to="/"
                    aria-label="Back to Sarabo public site"
                    className={cn(
                        "focus-ring flex items-center rounded-ds text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground",
                        collapsed ? "size-9 justify-center" : "mb-1 w-full gap-2 px-3 py-2"
                    )}
                >
                    <Home className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="text-sm">Back to Sarabo</span>}
                </Link>
                {!collapsed && role && (
                    <p className="mb-2 px-1 text-xs text-ds-muted-foreground">
                        Signed in as <span className="font-medium text-ds-foreground">{ROLE_LABELS[role] || 'Member'}</span>
                    </p>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-pressed={collapsed}
                    className={cn(!collapsed && "w-full justify-start px-3 text-ds-muted-foreground")}
                >
                    {collapsed ? <PanelLeft className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
                    {!collapsed && <span className="text-sm">Collapse</span>}
                </Button>
            </div>
        </aside>
    );
}

export { DashboardSidebar };
