const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Compact, glanceable format for the notification dropdown - intentionally
// hand-rolled rather than Intl.RelativeTimeFormat, whose built-in phrasing
// ("5 minutes ago") doesn't produce the short "5m ago" style used here.
// Older items fall back to a localized absolute date via Intl.DateTimeFormat.
export function formatRelativeTime(input) {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const absMs = Math.abs(diffMs);

    if (absMs < MINUTE) return 'Just now';
    if (absMs < HOUR) return `${Math.max(Math.round(absMs / MINUTE), 1)}m ago`;
    if (absMs < DAY) return `${Math.max(Math.round(absMs / HOUR), 1)}h ago`;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - DAY);
    if (date >= startOfYesterday && date < startOfToday) return 'Yesterday';

    if (absMs < 7 * DAY) return `${Math.max(Math.round(absMs / DAY), 1)}d ago`;

    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

// Exact datetime for accessible text/title attributes, so a screen-reader
// user or a hover tooltip isn't limited to the compact relative string.
export function formatAbsoluteDateTime(input) {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
