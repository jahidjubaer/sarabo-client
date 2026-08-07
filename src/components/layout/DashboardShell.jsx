import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { TooltipProvider } from '../ui/tooltip';
import useRole from '../../hooks/useRole';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { MobileDashboardNav } from './MobileDashboardNav';
import { CommandMenu } from './CommandMenu';

// UI-only, narrowly-namespaced storage for the sidebar collapse preference.
// Any storage failure is swallowed so rendering never depends on it.
const SIDEBAR_COLLAPSED_KEY = 'sarabo:sidebar-collapsed';
function readCollapsed() {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
        return false;
    }
}

// Authenticated dashboard shell (Phase 7.2). Owns the three independent UI
// states - desktop collapse (persisted), mobile sheet (transient), and command
// palette (transient) - and composes the sidebar, header, main content Outlet,
// mobile nav, and command menu. Role comes from the server-derived useRole();
// it only drives navigation VISIBILITY, never authorization (route guards
// remain authoritative). Page content renders in a full-width, min-w-0 main
// area with responsive padding - no marketing max-width is imposed.
function DashboardShell() {
    const { role } = useRole();
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);

    const toggleCollapse = useCallback(() => {
        setCollapsed((previous) => {
            const next = !previous;
            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
            } catch {
                /* storage unavailable - preference stays in-memory this session */
            }
            return next;
        });
    }, []);

    // Ctrl/Cmd+K toggles the command palette. preventDefault only for this
    // exact combo, so no other browser shortcut is affected.
    useEffect(() => {
        const onKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
                event.preventDefault();
                setCommandOpen((previous) => !previous);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <TooltipProvider>
            <div className="flex min-h-svh bg-ds-background text-ds-foreground">
                <DashboardSidebar role={role} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

                <div className="flex min-w-0 flex-1 flex-col">
                    <DashboardHeader
                        role={role}
                        onOpenMobileNav={() => setMobileNavOpen(true)}
                        onOpenCommand={() => setCommandOpen(true)}
                    />
                    <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        <Outlet />
                    </main>
                </div>

                <MobileDashboardNav role={role} open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
                <CommandMenu role={role} open={commandOpen} onOpenChange={setCommandOpen} />
            </div>
        </TooltipProvider>
    );
}

export default DashboardShell;
