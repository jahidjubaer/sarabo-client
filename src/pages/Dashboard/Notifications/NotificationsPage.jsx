import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationItem from '../../../components/notifications/NotificationItem';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../../../hooks/useNotifications';
import { notificationKeys } from '../../../hooks/notificationKeys';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';

const PAGE_LIMIT = 10;

function normalizePage(rawPage) {
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) return 1;
    return page;
}

function normalizeFilter(rawFilter) {
    return rawFilter === 'unread' ? 'unread' : 'all';
}

// Notification Center (Phase 12 presentation redesign). Every query, key,
// pagination rule, URL-normalization effect, mutation and optimistic path
// below is carried over unchanged - only the surface is rebuilt on the design
// system. Deliberately quiet: this is a supporting surface, so the page's own
// action ("Mark all as read") uses the ordinary primary treatment rather than
// marigold, which stays reserved for the operational dashboards' real
// next-step controls.
const NotificationsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const headerRef = useRef(null);
    const queryClient = useQueryClient();

    // URL search params are the single source of truth for page/filter -
    // normalized values (never the raw string) are what's actually used to
    // drive the query, so a missing/invalid URL never produces a bad
    // request; a background effect below only cleans up the URL itself
    // afterward, for shareability/Back-Forward/refresh consistency.
    const rawPage = searchParams.get('page');
    const rawFilter = searchParams.get('filter');
    const page = normalizePage(rawPage);
    const filter = normalizeFilter(rawFilter);
    const unreadOnly = filter === 'unread';
    const listQueryKey = notificationKeys.list({ page, limit: PAGE_LIMIT, unreadOnly });
    const unreadCountQueryKey = notificationKeys.unreadCount();

    const listQuery = useNotifications({ page, limit: PAGE_LIMIT, unreadOnly }, { keepPreviousPage: true });
    const unreadCountQuery = useUnreadNotificationCount();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const hasUsableList = Array.isArray(listQuery.data?.data)
        && listQuery.data?.pagination !== null
        && typeof listQuery.data?.pagination === 'object';
    const hasAuthoritativeList = hasUsableList && !listQuery.isPlaceholderData;
    const items = hasUsableList ? listQuery.data.data : [];
    const pagination = hasUsableList ? listQuery.data.pagination : {
        page, limit: PAGE_LIMIT, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false,
    };
    const hasUsableUnreadCount = typeof unreadCountQuery.data?.count === 'number';
    const unreadCount = hasUsableUnreadCount ? unreadCountQuery.data.count : undefined;
    const isListInitialLoading = (listQuery.isPending && !listQuery.isPaused && !hasUsableList)
        || (listQuery.isPlaceholderData && items.length === 0);
    const isListUnavailableBeforeData = listQuery.isPaused && !hasUsableList;
    const isListErrorBeforeData = listQuery.isError && !hasUsableList;
    const isUnreadCountInitialLoading = unreadCountQuery.isPending
        && !unreadCountQuery.isPaused
        && !hasUsableUnreadCount;
    const isUnreadCountUnavailableBeforeData = !hasUsableUnreadCount
        && (unreadCountQuery.isPaused || unreadCountQuery.isError);
    const retryList = () => queryClient.resetQueries({ queryKey: listQueryKey });
    const retryUnreadCount = () => queryClient.resetQueries({ queryKey: unreadCountQueryKey });

    // Single effect covering two conceptually separate concerns, merged into
    // one setSearchParams call site so they can never race each other:
    //
    // A. Synchronous URL-input normalization (missing/invalid page or
    //    filter) - never depends on server data at all.
    // B. Server-range normalization (page beyond the server's own
    //    totalPages - including a formerly-unread page becoming empty after
    //    a mark-one/mark-all elsewhere) - must depend only on a genuinely
    //    fresh, successful response for the CURRENT query key.
    //
    // Fixed defect: this used to gate B on just `!listQuery.isLoading`.
    // With keepPreviousPage (placeholderData: keepPreviousData - see
    // useNotifications.jsx), TanStack Query v5 reports isLoading: false AND
    // isSuccess: true even while still showing *retained data from a
    // different query key* during a page/filter transition - that's
    // exactly what isPlaceholderData: true means. The old guard could pass
    // during that window and rewrite a perfectly valid requested page using
    // a *different* page/filter's stale totalPages. The only reliable
    // signal that `listQuery.data` truly belongs to the current key is
    // `isSuccess && !isPlaceholderData && !isFetching` together - never
    // trust totalPages otherwise (loading, placeholder, mid-refetch, or
    // errored all fall through untouched).
    useEffect(() => {
        let correctedPage = page;
        const dataIsFreshForCurrentKey = listQuery.isSuccess && !listQuery.isPlaceholderData && !listQuery.isFetching;
        if (dataIsFreshForCurrentKey) {
            const totalPages = listQuery.data?.pagination?.totalPages;
            // totalPages === 0 is defensive only (the server always floors
            // it at 1 - see NotificationController.js) - never actively
            // rewritten in that case, which also means it can never loop.
            if (Number.isInteger(totalPages) && totalPages > 0 && correctedPage > totalPages) {
                correctedPage = totalPages;
            }
        }
        const urlNeedsPage = rawPage === null || String(correctedPage) !== rawPage;
        const urlNeedsFilter = rawFilter === null || filter !== rawFilter;
        if (urlNeedsPage || urlNeedsFilter) {
            setSearchParams((params) => {
                params.set('page', String(correctedPage));
                params.set('filter', filter);
                return params;
            }, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawPage, rawFilter, page, filter, listQuery.isSuccess, listQuery.isPlaceholderData, listQuery.isFetching, listQuery.data]);

    const handleFilterChange = (nextFilter) => {
        if (nextFilter === filter) return;
        setSearchParams((params) => {
            params.set('filter', nextFilter);
            params.set('page', '1');
            return params;
        });
        headerRef.current?.scrollIntoView({ block: 'start' });
    };

    const handlePageChange = (nextPage) => {
        setSearchParams((params) => {
            params.set('page', String(nextPage));
            params.set('filter', filter);
            return params;
        });
        headerRef.current?.scrollIntoView({ block: 'start' });
    };

    const handleActivate = (notification) => {
        if (!notification.isRead) {
            markRead.mutate(notification._id);
        }
    };

    const handleMarkAll = () => {
        if (markAllRead.isPending || !unreadCount) return;
        markAllRead.mutate();
    };

    const filterTabClass = (active) => cn(
        'focus-ring rounded-ds px-3 py-1.5 text-body-sm font-medium transition-colors',
        active
            ? 'bg-ds-card text-ds-foreground shadow-sm'
            : 'text-ds-muted-foreground hover:text-ds-foreground'
    );

    return (
        <div className="space-y-6">
            <div ref={headerRef}>
                <PageHeader
                    eyebrow="Account"
                    title="Notifications"
                    description="Updates about your technician application, repair requests and payments."
                    actions={
                        <LoadingButton
                            type="button"
                            onClick={handleMarkAll}
                            disabled={!unreadCount}
                            loading={markAllRead.isPending}
                            loadingText="Marking…"
                            size="sm"
                        >
                            <CheckCheck aria-hidden="true" /> Mark all as read
                        </LoadingButton>
                    }
                />
                {/* Unread count is authoritative or absent - never a false zero. */}
                {typeof unreadCount === 'number' && unreadCount > 0 && (
                    <p className="mt-3 text-body-sm text-ds-foreground">
                        <span className="ds-numeric font-semibold">{unreadCount}</span> unread
                    </p>
                )}
                {isUnreadCountInitialLoading && (
                    <p className="mt-3 text-body-sm text-ds-muted-foreground">Checking unread count…</p>
                )}
                {isUnreadCountUnavailableBeforeData && (
                    <p className="mt-3 text-body-sm text-ds-muted-foreground">
                        Unread count is unavailable.{' '}
                        <button type="button" onClick={retryUnreadCount} className="focus-ring rounded-ds font-medium text-ds-primary underline underline-offset-2">
                            Try again
                        </button>
                    </p>
                )}
            </div>

            {markAllRead.isError && (
                <Alert tone="danger">
                    <AlertDescription>Could not mark all as read. Please try again.</AlertDescription>
                </Alert>
            )}

            <div className="flex w-fit gap-1 rounded-ds-lg border border-ds-border bg-ds-muted p-1" role="group" aria-label="Filter notifications">
                <button
                    type="button"
                    aria-pressed={filter === 'all'}
                    className={filterTabClass(filter === 'all')}
                    onClick={() => handleFilterChange('all')}
                >
                    All
                </button>
                <button
                    type="button"
                    aria-pressed={filter === 'unread'}
                    className={filterTabClass(filter === 'unread')}
                    onClick={() => handleFilterChange('unread')}
                >
                    Unread{typeof unreadCount === 'number' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
            </div>

            <div>
                {isListInitialLoading && (
                    <ul className="flex flex-col gap-2" aria-hidden="true">
                        {[0, 1, 2, 3].map((key) => (
                            <li key={key} className="flex items-start gap-3 rounded-ds-lg border border-ds-border bg-ds-card px-4 py-4">
                                <Skeleton className="size-10 shrink-0 rounded-ds-lg" />
                                <span className="flex-1 space-y-2">
                                    <Skeleton className="block h-4 w-1/2" />
                                    <Skeleton className="block h-4 w-full" />
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {(isListUnavailableBeforeData || isListErrorBeforeData) && (
                    <ErrorState
                        title="Couldn't load notifications"
                        description="Your notifications are unavailable right now. Please try again."
                        onRetry={retryList}
                    />
                )}

                {hasAuthoritativeList && items.length === 0 && filter === 'all' && (
                    <EmptyState
                        icon={Bell}
                        title="No notifications yet"
                        description="Updates about your technician application, repair requests and payments will appear here."
                    />
                )}

                {hasAuthoritativeList && items.length === 0 && filter === 'unread' && (
                    <EmptyState
                        icon={BellOff}
                        title="You're all caught up"
                        description="There are no unread notifications right now."
                        action={
                            <Button type="button" variant="outline" size="sm" onClick={() => handleFilterChange('all')}>
                                View all notifications
                            </Button>
                        }
                    />
                )}

                {hasUsableList && items.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {items.map((item) => (
                            <li key={item._id} className="rounded-ds-lg border border-ds-border bg-ds-card">
                                <NotificationItem notification={item} onActivate={handleActivate} variant="page" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {hasUsableList && pagination.totalPages > 1 && (
                <nav aria-label="Notifications pagination" className="flex items-center justify-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(page - 1, 1))}
                        disabled={!pagination.hasPreviousPage || listQuery.isFetching}
                        aria-label="Previous page"
                    >
                        <ChevronLeft aria-hidden="true" /> Previous
                    </Button>
                    <span className="ds-numeric px-2 text-body-sm text-ds-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!pagination.hasNextPage || listQuery.isFetching}
                        aria-label="Next page"
                    >
                        Next <ChevronRight aria-hidden="true" />
                    </Button>
                </nav>
            )}
        </div>
    );
};

export default NotificationsPage;
