import { NavLink } from 'react-router';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

// Renders the role-aware nav sections for both the desktop sidebar and the
// mobile sheet (single implementation, no duplication). Active state uses
// NavLink's nested-route awareness (`end` for index routes) and is signalled by
// a marigold rail + a tonal background + a weight change + aria-current - never
// colour alone. When `collapsed`, items are icon-only and each is wrapped in a
// Tooltip so its label stays discoverable.
//
// Phase 7: both surfaces this renders on are INK, so the palette here is the
// ink pair rather than the page surface tokens. The marigold rail is the only
// marigold in the whole shell, which is what keeps a page's own primary action
// unmistakable.
//
// COUNTS. Only one nav item carries a count, and it re-reads a query the shell
// already runs: useUnreadNotificationCount is mounted by the header's
// NotificationBell on every dashboard route and polls on its own existing
// schedule. Subscribing here adds an observer to that same cache entry - the
// same query key, no second request, no new key, no new endpoint. Every other
// nav item would have needed a fetch that does not exist yet, so per the
// fetch-budget rule they carry no count at all.
function NavCount() {
    const { data } = useUnreadNotificationCount();
    const count = data?.count;
    // Absent while loading/errored and absent at zero - never a false "0".
    if (typeof count !== 'number' || count < 1) return null;
    const display = count > 99 ? '99+' : String(count);

    return (
        <span
            className="ds-numeric ml-auto shrink-0 rounded-full bg-ds-ink-foreground/15 px-1.5 py-0.5 text-micro font-semibold text-ds-ink-foreground"
            aria-label={`${count} unread`}
        >
            {display}
        </span>
    );
}

function NavItem({ item, collapsed, onNavigate }) {
    const Icon = item.icon;
    const link = (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            // Collapsed, the label span is not rendered, so the link would have
            // no accessible NAME - the Tooltip only supplies a description, and
            // only once it is actually shown. An explicit label makes the name
            // independent of hover/focus behaviour entirely.
            aria-label={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                cn(
                    'group relative flex items-center gap-3 rounded-ds px-3 py-2 text-body-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ds-ring',
                    collapsed && 'justify-center px-0',
                    isActive
                        ? 'bg-ds-ink-foreground/10 font-semibold text-ds-ink-foreground'
                        : 'font-medium text-ds-ink-foreground/65 hover:bg-ds-ink-foreground/5 hover:text-ds-ink-foreground'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        aria-hidden="true"
                        // The marigold class is applied only when active, so the
                        // action colour is literally absent from the DOM for every
                        // other item rather than merely hidden behind opacity.
                        className={cn(
                            'absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-full transition-all',
                            isActive ? 'h-5 bg-ds-action opacity-100' : 'h-0 opacity-0'
                        )}
                    />
                    {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge === 'notifications' ? <NavCount /> : null}
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
        <nav className="flex flex-col gap-6" aria-label="Dashboard sections">
            {sections.map((section) => (
                <div key={section.heading}>
                    {!collapsed && (
                        <p className="ds-label px-3 pb-2 text-ds-ink-foreground/45">{section.heading}</p>
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
