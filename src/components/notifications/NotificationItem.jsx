import { Link } from 'react-router';
import { renderNotificationIcon } from '../../utils/notificationEventIcons';
import { formatRelativeTime, formatAbsoluteDateTime } from '../../utils/relativeTime';
import { isSafeInternalPath } from '../../utils/isSafeInternalPath';
import { cn } from '../../lib/utils';

// Renders only server-safe fields (title/message/createdAt/isRead/actionUrl) -
// the read API intentionally never returns recipient/actor identity (see
// sarabo-server's NotificationController.js SAFE_FIELDS), so this component
// never expects them.
//
// `variant` is PRESENTATION ONLY:
// - 'dropdown' (default) - the compact bell preview row.
// - 'page' - the full Notification Center row (Phase 5.3 Unit 2): more generous
//   spacing and a taller message clamp.
//
// Phase 13A dropped the `role="menuitem"` the dropdown variant used to carry.
// The bell panel was never an ARIA menu (see NotificationBell.jsx), and a
// menuitem outside a menu is invalid - it also suppressed the native link/button
// role that actually tells a user what activating the row will do. Both variants
// are now plain links (or buttons, when there is no safe actionUrl) inside a
// list, which is what they have always behaved like.
//
// UNREAD IS NEVER COLOUR-ONLY (Phase 12). Three independent signals carry it:
// a readable "Unread" tag, a heavier title, and a tinted row/icon. The tag
// replaced the old aria-hidden dot, which was the single non-weight cue and
// was invisible to assistive tech. Read rows stay deliberately plain - nothing
// here escalates an ordinary update into something that looks urgent.
const NotificationItem = ({ notification, onActivate, variant = 'dropdown' }) => {
    const hasValidLink = isSafeInternalPath(notification.actionUrl);
    const unread = !notification.isRead;
    const isPageVariant = variant === 'page';

    const sharedClass = cn(
        'focus-ring flex w-full items-start gap-3 rounded-ds text-left transition-colors',
        isPageVariant ? 'px-4 py-4' : 'px-3 py-2.5',
        unread ? 'bg-ds-accent/40 hover:bg-ds-accent/70' : 'bg-transparent hover:bg-ds-muted'
    );

    const content = (
        <>
            <span
                aria-hidden="true"
                className={cn(
                    'mt-0.5 flex shrink-0 items-center justify-center rounded-ds-lg',
                    isPageVariant ? 'size-10' : 'size-8',
                    unread ? 'bg-ds-primary/10 text-ds-primary' : 'bg-ds-muted text-ds-muted-foreground'
                )}
            >
                {renderNotificationIcon(notification.type, { className: isPageVariant ? 'size-5' : 'size-4' })}
            </span>
            <span className="min-w-0 flex-1">
                <span
                    className={cn(
                        'line-clamp-2 break-words',
                        isPageVariant ? 'text-subhead' : 'text-body-sm font-semibold',
                        unread ? 'text-ds-foreground' : 'font-medium text-ds-foreground/75'
                    )}
                >
                    {notification.title}
                </span>
                <span className={cn('mt-0.5 block break-words text-body-sm text-ds-muted-foreground', isPageVariant ? 'line-clamp-3' : 'line-clamp-2')}>
                    {notification.message}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                        className="text-micro text-ds-muted-foreground"
                        title={formatAbsoluteDateTime(notification.createdAt)}
                    >
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                    {unread && (
                        <span className="ds-label rounded-full bg-ds-primary/10 px-1.5 py-1 text-ds-primary">
                            Unread
                        </span>
                    )}
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
            >
                {content}
            </Link>
        );
    }

    // Missing/invalid actionUrl: the item stays interactive (so an unread
    // notification can still be marked read) but never navigates.
    return (
        <button type="button" onClick={() => onActivate(notification)} className={sharedClass}>
            {content}
        </button>
    );
};

export default NotificationItem;
