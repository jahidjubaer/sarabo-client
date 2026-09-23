import { useEffect } from 'react';
import { NavLink } from 'react-router';
import { getMobileTabs } from '../../config/dashboardNavigation';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

// Bottom tab bar for customers and technicians below lg (admins keep the menu
// sheet). Five destinations at most, 64px tall plus the safe-area inset, every
// target at least 48px wide. While mounted it sets `.has-tabbar` on <html>,
// which lifts floating UI (the support button) above the bar - see
// styles/base.css. Visibility only; route guards stay authoritative.
function TabCount() {
    // Same cached query the header bell already runs - no extra request.
    const { data } = useUnreadNotificationCount();
    const count = data?.count;
    if (typeof count !== 'number' || count < 1) return null;
    return (
        <span className="ds-numeric absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ds-destructive px-1 text-[10px] font-bold text-ds-destructive-foreground">
            {count > 99 ? '99+' : count}
            <span className="sr-only"> unread</span>
        </span>
    );
}

function MobileTabBar({ role }) {
    const tabs = getMobileTabs(role);

    useEffect(() => {
        if (!tabs) return undefined;
        document.documentElement.classList.add('has-tabbar');
        return () => document.documentElement.classList.remove('has-tabbar');
    }, [tabs]);

    if (!tabs) return null;

    return (
        <nav
            aria-label="Quick navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-ds-border bg-ds-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-ds-card/85 lg:hidden"
        >
            <ul className="mx-auto grid h-16 max-w-lg" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <li key={tab.to} className="flex">
                            <NavLink
                                to={tab.to}
                                end={tab.end}
                                aria-label={tab.emphasis ? tab.label : undefined}
                                className={({ isActive }) => cn(
                                    'focus-ring flex flex-1 flex-col items-center justify-center gap-1 rounded-ds text-[11px] font-semibold transition-colors',
                                    isActive ? 'text-ds-primary' : 'text-ds-muted-foreground hover:text-ds-foreground'
                                )}
                            >
                                {tab.emphasis ? (
                                    <span className="flex size-11 items-center justify-center rounded-full bg-ds-ink text-ds-ink-foreground shadow-md">
                                        <Icon aria-hidden="true" className="size-6" />
                                    </span>
                                ) : (
                                    <>
                                        <span className="relative">
                                            <Icon aria-hidden="true" className="size-6" />
                                            {tab.badge === 'notifications' ? <TabCount /> : null}
                                        </span>
                                        {tab.label}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export { MobileTabBar };
