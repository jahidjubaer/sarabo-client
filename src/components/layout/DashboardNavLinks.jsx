import { NavLink } from 'react-router';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { cn } from '../../lib/utils';

// Renders the role-aware nav sections for both the desktop sidebar and the
// mobile sheet (single implementation, no duplication). Active state uses
// NavLink's nested-route awareness (`end` for index routes) and is signalled
// by a left accent bar + tonal background + aria-current - never colour alone.
// When `collapsed`, items are icon-only and each is wrapped in a Tooltip so its
// label stays discoverable.

function NavItem({ item, collapsed, onNavigate }) {
    const Icon = item.icon;
    const link = (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    "group relative flex items-center gap-3 rounded-ds px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ds-ring",
                    collapsed && "justify-center px-0",
                    isActive
                        ? "bg-ds-accent text-ds-accent-foreground"
                        : "text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        aria-hidden="true"
                        className={cn(
                            "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ds-primary transition-opacity",
                            isActive ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                </>
            )}
        </NavLink>
    );

    if (!collapsed) return link;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
    );
}

function DashboardNavLinks({ sections, collapsed = false, onNavigate }) {
    return (
        <nav className="flex flex-col gap-5" aria-label="Dashboard sections">
            {sections.map((section) => (
                <div key={section.heading}>
                    {!collapsed && (
                        <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-ds-muted-foreground">
                            {section.heading}
                        </p>
                    )}
                    <ul className="flex flex-col gap-0.5">
                        {section.items.map((item) => (
                            <li key={item.to}>
                                <NavItem item={item} collapsed={collapsed} onNavigate={onNavigate} />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

export { DashboardNavLinks };
