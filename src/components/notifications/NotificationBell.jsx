import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useClickOutside from '../../hooks/useClickOutside';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { notificationKeys } from '../../hooks/notificationKeys';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';

// Bell-preview list only ever needs a small, recent slice - never the full
// notification center's pagination range (Phase 5.3 Unit 1 explicitly
// excludes a full center page/infinite scroll).
const PREVIEW_PARAMS = { page: 1, limit: 8 };

function formatBadgeCount(count) {
    return count > 99 ? '99+' : String(count);
}

// Phase 12 owns this component's presentation. Everything behavioural is
// carried over untouched: the open/close toggle, useClickOutside, the Escape
// handler that returns focus to the trigger, the route-change and logout
// close-on-render checks, the preview query (page 1, limit 8, fetched only
// while open), the shared unread-count query, and mark-one/mark-all.
//
// The unread badge is verdigris, not red: an unread notification is
// information, not an error - and marigold stays reserved for a real primary
// action, which a passive count is not.
const NotificationBell = () => {
    const { user } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();

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

    const hasUsableUnreadCount = typeof unreadCountQuery.data?.count === 'number';
    const unreadCount = hasUsableUnreadCount ? unreadCountQuery.data.count : undefined;
    // Absent before usable data (never a false "0" badge) and absent at exactly
    // zero. Cached successful counts remain usable through a failed refetch.
    const showBadge = typeof unreadCount === 'number' && unreadCount > 0;
    const hasUsablePreview = Array.isArray(listQuery.data?.data)
        && listQuery.data?.pagination !== null
        && typeof listQuery.data?.pagination === 'object';
    const items = hasUsablePreview ? listQuery.data.data : [];
    const isPreviewInitialLoading = listQuery.isPending && !listQuery.isPaused && !hasUsablePreview;
    const isPreviewUnavailableBeforeData = listQuery.isPaused && !hasUsablePreview;
    const isPreviewErrorBeforeData = listQuery.isError && !hasUsablePreview;
    const isUnreadCountInitialLoading = unreadCountQuery.isPending
        && !unreadCountQuery.isPaused
        && !hasUsableUnreadCount;
    const isUnreadCountUnavailableBeforeData = !hasUsableUnreadCount
        && (unreadCountQuery.isPaused || unreadCountQuery.isError);
    const previewQueryKey = notificationKeys.list(PREVIEW_PARAMS);
    const unreadCountQueryKey = notificationKeys.unreadCount();
    const retryPreview = () => queryClient.resetQueries({ queryKey: previewQueryKey });
    const retryUnreadCount = () => queryClient.resetQueries({ queryKey: unreadCountQueryKey });

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
                className="focus-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-ds text-ds-foreground transition-colors hover:bg-ds-accent hover:text-ds-accent-foreground"
            >
                <Bell aria-hidden="true" className="size-5" />
                {showBadge && (
                    <span
                        aria-hidden="true"
                        className="ds-numeric absolute right-1 top-1 min-w-4 rounded-full bg-ds-primary px-1 py-px text-center text-[10px] font-semibold leading-none text-ds-primary-foreground"
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
                    className="absolute right-0 z-50 mt-2 w-[92vw] max-w-[380px] rounded-ds-lg border border-ds-border bg-ds-popover text-ds-popover-foreground shadow-lg sm:w-[380px]"
                >
                    <div className="flex items-start justify-between gap-2 border-b border-ds-border px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-subhead text-ds-foreground">Notifications</p>
                            {typeof unreadCount === 'number' && unreadCount > 0 && (
                                <p className="text-micro text-ds-muted-foreground">
                                    <span className="ds-numeric font-semibold">{unreadCount}</span> unread
                                </p>
                            )}
                            {isUnreadCountInitialLoading && (
                                <p className="text-micro text-ds-muted-foreground">Checking unread count…</p>
                            )}
                            {isUnreadCountUnavailableBeforeData && (
                                <p className="text-micro text-ds-muted-foreground">
                                    Unread count unavailable.{' '}
                                    <button type="button" onClick={retryUnreadCount} className="focus-ring rounded-ds font-medium text-ds-primary underline underline-offset-2">
                                        Try again
                                    </button>
                                </p>
                            )}
                        </div>
                        <LoadingButton
                            type="button"
                            onClick={handleMarkAll}
                            disabled={!unreadCount}
                            loading={markAllRead.isPending}
                            loadingText="Marking…"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-micro"
                        >
                            Mark all as read
                        </LoadingButton>
                    </div>

                    {markAllRead.isError && (
                        <p className="px-4 pt-2 text-micro text-ds-destructive" role="alert">
                            Could not mark all as read. Please try again.
                        </p>
                    )}

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {isPreviewInitialLoading && (
                            <div className="flex flex-col gap-1 p-1" aria-hidden="true">
                                {[0, 1, 2].map((key) => (
                                    <div key={key} className="flex items-start gap-3 px-2 py-2.5">
                                        <Skeleton className="size-8 shrink-0 rounded-ds-lg" />
                                        <span className="flex-1 space-y-2">
                                            <Skeleton className="block h-3 w-3/4" />
                                            <Skeleton className="block h-3 w-1/2" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(isPreviewUnavailableBeforeData || isPreviewErrorBeforeData) && (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <p className="text-body-sm text-ds-muted-foreground">Could not load notifications.</p>
                                <Button type="button" variant="outline" size="sm" onClick={retryPreview}>
                                    Try again
                                </Button>
                            </div>
                        )}

                        {hasUsablePreview && items.length === 0 && (
                            <div className="py-8 text-center text-body-sm text-ds-muted-foreground">
                                You&apos;re all caught up.
                            </div>
                        )}

                        {hasUsablePreview && items.length > 0 && (
                            <ul className="flex flex-col gap-1">
                                {items.map((item) => (
                                    <li key={item._id}>
                                        <NotificationItem notification={item} onActivate={handleActivate} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Fixed target, never server/user data, so no
                    isSafeInternalPath check is needed here - unlike
                    NotificationItem's actionUrl. Closes the dropdown but
                    never touches mark-one/mark-all. */}
                    <Link
                        to="/dashboard/notifications"
                        onClick={close}
                        className="focus-ring block rounded-b-ds-lg border-t border-ds-border px-4 py-2.5 text-center text-body-sm font-medium text-ds-primary hover:bg-ds-muted"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
