import { Link } from 'react-router';
import { renderNotificationIcon } from '../../utils/notificationEventIcons';
import { formatRelativeTime, formatAbsoluteDateTime } from '../../utils/relativeTime';
import { isSafeInternalPath } from '../../utils/isSafeInternalPath';

// Renders only server-safe fields (title/message/createdAt/isRead/actionUrl) -
// the read API intentionally never returns recipient/actor identity (see
// sarabo-server's NotificationController.js SAFE_FIELDS), so this component
// never expects them.
const NotificationItem = ({ notification, onActivate }) => {
    const hasValidLink = isSafeInternalPath(notification.actionUrl);
    const unread = !notification.isRead;

    const sharedClass = `focus-ring flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${unread ? 'bg-primary/5 hover:bg-primary/10' : 'bg-transparent hover:bg-base-200'
        }`;

    const content = (
        <>
            <span
                aria-hidden="true"
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50'
                    }`}
            >
                {renderNotificationIcon(notification.type, { className: 'h-4 w-4' })}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                    <span
                        className={`line-clamp-1 text-sm ${unread ? 'font-semibold text-base-content' : 'font-medium text-base-content/80'
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
                <span className="line-clamp-2 text-sm text-base-content/70">{notification.message}</span>
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
                role="menuitem"
            >
                {content}
            </Link>
        );
    }

    // Missing/invalid actionUrl: the item stays interactive (so an unread
    // notification can still be marked read) but never navigates.
    return (
        <button type="button" onClick={() => onActivate(notification)} className={sharedClass} role="menuitem">
            {content}
        </button>
    );
};

export default NotificationItem;
