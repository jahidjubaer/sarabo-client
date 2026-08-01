import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import NotificationItem from '../../../components/notifications/NotificationItem';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../../../hooks/useNotifications';

const PAGE_LIMIT = 10;

function normalizePage(rawPage) {
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) return 1;
    return page;
}

function normalizeFilter(rawFilter) {
    return rawFilter === 'unread' ? 'unread' : 'all';
}

const NotificationsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const headerRef = useRef(null);

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

    const listQuery = useNotifications({ page, limit: PAGE_LIMIT, unreadOnly }, { keepPreviousPage: true });
    const unreadCountQuery = useUnreadNotificationCount();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const items = listQuery.data?.data ?? [];
    const pagination = listQuery.data?.pagination ?? {
        page, limit: PAGE_LIMIT, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false,
    };
    const unreadCount = unreadCountQuery.data?.count;

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

    return (
        <div>
            <div ref={headerRef} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-4xl font-bold">Notifications</h1>
                    <p className="mt-2 opacity-70">
                        Track updates about your technician application, repair requests and payments.
                    </p>
                    {typeof unreadCount === 'number' && unreadCount > 0 && (
                        <p className="mt-2 text-sm font-medium text-primary">{unreadCount} unread</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleMarkAll}
                    disabled={!unreadCount || markAllRead.isPending}
                    aria-busy={markAllRead.isPending}
                    className="focus-ring btn btn-outline"
                >
                    {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
                </button>
            </div>

            {markAllRead.isError && (
                <div className="alert alert-error mt-4">
                    <span>Could not mark all as read. Please try again.</span>
                </div>
            )}

            <div className="mt-6 flex w-fit gap-1 rounded-box border border-base-300 p-1" role="group" aria-label="Filter notifications">
                <button
                    type="button"
                    aria-pressed={filter === 'all'}
                    className={`focus-ring btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleFilterChange('all')}
                >
                    All
                </button>
                <button
                    type="button"
                    aria-pressed={filter === 'unread'}
                    className={`focus-ring btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleFilterChange('unread')}
                >
                    Unread{typeof unreadCount === 'number' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
            </div>

            <div className="mt-6">
                {listQuery.isLoading && (
                    <ul className="flex flex-col gap-2" aria-hidden="true">
                        {[0, 1, 2, 3].map((key) => (
                            <li key={key} className="flex items-start gap-3 rounded-lg border border-base-300 px-4 py-4">
                                <span className="skeleton h-10 w-10 shrink-0 rounded-full"></span>
                                <span className="flex-1">
                                    <span className="skeleton mb-2 block h-4 w-1/2 rounded"></span>
                                    <span className="skeleton block h-4 w-full rounded"></span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {!listQuery.isLoading && listQuery.isError && (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-base-300 py-16 text-center">
                        <p className="opacity-70">Could not load notifications.</p>
                        <button type="button" onClick={() => listQuery.refetch()} className="focus-ring btn btn-primary btn-sm">
                            Retry
                        </button>
                    </div>
                )}

                {!listQuery.isLoading && !listQuery.isError && items.length === 0 && filter === 'all' && (
                    <div className="rounded-lg border border-base-300 py-16 text-center">
                        <p className="text-lg font-semibold">No notifications yet</p>
                        <p className="mt-2 opacity-70">
                            Updates about your technician application, repair requests and payments will appear here.
                        </p>
                    </div>
                )}

                {!listQuery.isLoading && !listQuery.isError && items.length === 0 && filter === 'unread' && (
                    <div className="rounded-lg border border-base-300 py-16 text-center">
                        <p className="text-lg font-semibold">You&apos;re all caught up</p>
                        <p className="mt-2 opacity-70">There are no unread notifications right now.</p>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className="focus-ring btn btn-ghost btn-sm mt-4"
                        >
                            View all notifications
                        </button>
                    </div>
                )}

                {!listQuery.isLoading && !listQuery.isError && items.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {items.map((item) => (
                            <li key={item._id} className="rounded-lg border border-base-300">
                                <NotificationItem notification={item} onActivate={handleActivate} variant="page" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <nav aria-label="Notifications pagination" className="join mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => handlePageChange(Math.max(page - 1, 1))}
                        disabled={!pagination.hasPreviousPage || listQuery.isFetching}
                        aria-label="Previous page"
                        className="join-item btn"
                    >
                        Previous
                    </button>
                    <span className="join-item btn btn-disabled">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!pagination.hasNextPage || listQuery.isFetching}
                        aria-label="Next page"
                        className="join-item btn"
                    >
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
};

export default NotificationsPage;
