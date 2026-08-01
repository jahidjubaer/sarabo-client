import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { FaBell } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import useClickOutside from '../../hooks/useClickOutside';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

// Bell-preview list only ever needs a small, recent slice - never the full
// notification center's pagination range (Phase 5.3 Unit 1 explicitly
// excludes a full center page/infinite scroll).
const PREVIEW_PARAMS = { page: 1, limit: 8 };

function formatBadgeCount(count) {
    return count > 99 ? '99+' : String(count);
}

const NotificationBell = () => {
    const { user } = useAuth();
    const location = useLocation();

    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);
    useClickOutside(containerRef, close, open);

    // Route change closes the dropdown - mirrors NavBar's own
    // render-time pathname-diff pattern (never a setState-in-effect cascade).
    const [prevPathname, setPrevPathname] = useState(location.pathname);
    if (location.pathname !== prevPathname) {
        setPrevPathname(location.pathname);
        if (open) setOpen(false);
    }

    // Logout closes the dropdown - derived during render (same sanctioned
    // pattern as the pathname check above), never a setState-in-effect
    // cascade. NavBar itself only mounts this component while `user` is
    // truthy, so this mainly guards the brief instant between the auth
    // state flipping and the unmount actually happening.
    const [prevUser, setPrevUser] = useState(user);
    if (user !== prevUser) {
        setPrevUser(user);
        if (!user && open) setOpen(false);
    }

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const unreadCountQuery = useUnreadNotificationCount();
    // Fetched only once the dropdown is actually opened, never in the
    // background while closed (Phase F: no constant polling while closed).
    const listQuery = useNotifications(PREVIEW_PARAMS, { enabled: open });
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    if (!user) return null;

    const unreadCount = unreadCountQuery.data?.count;
    // Absent while loading/errored (never a false "0" badge) and absent at
    // exactly zero - the badge only ever renders for a genuine positive count.
    const showBadge = typeof unreadCount === 'number' && unreadCount > 0;
    const items = listQuery.data?.data ?? [];

    const handleActivate = (notification) => {
        if (!notification.isRead) {
            markRead.mutate(notification._id);
        }
        setOpen(false);
    };

    const handleMarkAll = () => {
        if (markAllRead.isPending || !unreadCount) return;
        markAllRead.mutate();
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="notification-panel"
                aria-label={showBadge ? `Notifications, ${formatBadgeCount(unreadCount)} unread` : 'Notifications'}
                className="focus-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-base-200"
            >
                <FaBell aria-hidden="true" className="h-5 w-5" />
                {showBadge && (
                    <span
                        aria-hidden="true"
                        className="badge badge-error badge-sm absolute -top-1 -right-1 px-1 text-[10px] leading-none"
                    >
                        {formatBadgeCount(unreadCount)}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id="notification-panel"
                    role="menu"
                    aria-label="Notifications"
                    className="absolute right-0 z-50 mt-2 w-[92vw] max-w-[380px] rounded-box border border-base-300 bg-base-100 shadow-lg sm:w-[380px]"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-base-300 px-4 py-3">
                        <div>
                            <p className="font-semibold">Notifications</p>
                            {typeof unreadCount === 'number' && unreadCount > 0 && (
                                <p className="text-xs text-base-content/60">{unreadCount} unread</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleMarkAll}
                            disabled={!unreadCount || markAllRead.isPending}
                            aria-busy={markAllRead.isPending}
                            className="focus-ring btn btn-ghost btn-xs"
                        >
                            {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
                        </button>
                    </div>

                    {markAllRead.isError && (
                        <p className="px-4 pt-2 text-xs text-error" role="alert">
                            Could not mark all as read. Please try again.
                        </p>
                    )}

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {listQuery.isLoading && (
                            <div className="flex flex-col gap-1 p-1" aria-hidden="true">
                                {[0, 1, 2].map((key) => (
                                    <div key={key} className="flex items-start gap-3 px-2 py-2.5">
                                        <span className="skeleton h-8 w-8 shrink-0 rounded-full"></span>
                                        <span className="flex-1">
                                            <span className="skeleton mb-2 block h-3 w-3/4 rounded"></span>
                                            <span className="skeleton block h-3 w-1/2 rounded"></span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!listQuery.isLoading && listQuery.isError && (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <p className="text-sm text-base-content/70">Could not load notifications.</p>
                                <button
                                    type="button"
                                    onClick={() => listQuery.refetch()}
                                    className="focus-ring btn btn-ghost btn-xs"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!listQuery.isLoading && !listQuery.isError && items.length === 0 && (
                            <div className="py-8 text-center text-sm text-base-content/60">
                                You&apos;re all caught up.
                            </div>
                        )}

                        {!listQuery.isLoading && !listQuery.isError && items.length > 0 && (
                            <ul className="flex flex-col gap-1">
                                {items.map((item) => (
                                    <li key={item._id}>
                                        <NotificationItem notification={item} onActivate={handleActivate} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
