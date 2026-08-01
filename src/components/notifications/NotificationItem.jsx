import { Link } from 'react-router';
import { renderNotificationIcon } from '../../utils/notificationEventIcons';
import { formatRelativeTime, formatAbsoluteDateTime } from '../../utils/relativeTime';
import { isSafeInternalPath } from '../../utils/isSafeInternalPath';

// Renders only server-safe fields (title/message/createdAt/isRead/actionUrl) -
// the read API intentionally never returns recipient/actor identity (see
// sarabo-server's NotificationController.js SAFE_FIELDS), so this component
// never expects them.
//
// `variant`:
// - 'dropdown' (default) - the bell preview list, `role="menuitem"` (it's a
//   genuine ARIA menu widget there - see NotificationBell.jsx).
// - 'page' - the full Notification Center list (Phase 5.3 Unit 2), a plain
//   semantic list rather than a menu, so no menuitem role; more generous
//   spacing and a taller message clamp than the compact dropdown row.
const NotificationItem = ({ notification, onActivate, variant = 'dropdown' }) => {
    const hasValidLink = isSafeInternalPath(notification.actionUrl);
    const unread = !notification.isRead;
    const isPageVariant = variant === 'page';
    const role = isPageVariant ? undefined : 'menuitem';

    const sharedClass = `focus-ring flex w-full items-start gap-3 rounded-lg text-left transition-colors ${isPageVariant ? 'px-4 py-4' : 'px-3 py-2.5'
        } ${unread ? 'bg-primary/5 hover:bg-primary/10' : 'bg-transparent hover:bg-base-200'}`;

    const content = (
        <>
            <span
                aria-hidden="true"
                className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full ${isPageVariant ? 'h-10 w-10' : 'h-8 w-8'
                    } ${unread ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50'}`}
            >
                {renderNotificationIcon(notification.type, { className: isPageVariant ? 'h-5 w-5' : 'h-4 w-4' })}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                    <span
                        className={`line-clamp-1 ${isPageVariant ? 'text-base' : 'text-sm'} ${unread ? 'font-semibold text-base-content' : 'font-medium text-base-content/80'
                            }`}
                    >
                        {notification.title}
                    </span>
                    {unread && (
                        <span
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                    )}
                </span>
                <span className={`${isPageVariant ? 'line-clamp-3' : 'line-clamp-2'} text-sm text-base-content/70`}>
                    {notification.message}
                </span>
                <span
                    className="mt-1 block text-xs text-base-content/50"
                    title={formatAbsoluteDateTime(notification.createdAt)}
                >
                    {formatRelativeTime(notification.createdAt)}
                </span>
            </span>
        </>
    );

    if (hasValidLink) {
        return (
            <Link
                to={notification.actionUrl}
                onClick={() => onActivate(notification)}
                className={sharedClass}
                role={role}
            >
                {content}
            </Link>
        );
    }

    // Missing/invalid actionUrl: the item stays interactive (so an unread
    // notification can still be marked read) but never navigates.
    return (
        <button type="button" onClick={() => onActivate(notification)} className={sharedClass} role={role}>
            {content}
        </button>
    );
};

export default NotificationItem;
