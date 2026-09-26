// Admin reports (reports phase): pure formatting helpers. The server does all
// the counting (GET /admin/reports).
import { humanizeSlug } from './serviceDefinitionCatalog';

// The two lines of the requests-over-time chart, in fixed colour order.
export const TREND_SERIES = [
    { key: 'created', name: 'Requests made', color: 'var(--ds-chart-1)' },
    { key: 'completed', name: 'Repairs finished', color: 'var(--ds-chart-2)' },
];

export const REPORT_RANGES = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
];

export function normalizeRange(value) {
    return REPORT_RANGES.some((r) => r.value === value) ? value : '30';
}

// "YYYY-MM-DD" is a Bangladesh calendar day; format it in UTC so the viewer's
// own timezone can't shift it by a day.
export function formatReportDate(date, { weekday } = {}) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return String(date ?? '');
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', ...(weekday ? { weekday } : {}) }).format(parsed);
}

export function formatCount(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-US') : '—';
}

export function formatPercent(value) {
    return typeof value === 'number' && Number.isFinite(value) ? `${value}%` : '—';
}

export function formatDays(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    return `${value} day${value === 1 ? '' : 's'}`;
}

// The line under a headline number: the same figure for the period before.
export function previousHint(value, days, format = formatCount) {
    return `Previous ${days} days: ${format(value)}`;
}

export function labelSlug(slug) {
    return typeof slug === 'string' && slug ? humanizeSlug(slug) : 'Unknown';
}

// Pickup grid rows, Saturday first (the working week in Bangladesh). Friday
// stays in, marked closed, so an empty row is explained rather than missing.
export const PICKUP_WEEKDAYS = [
    { weekday: 6, label: 'Saturday' },
    { weekday: 0, label: 'Sunday' },
    { weekday: 1, label: 'Monday' },
    { weekday: 2, label: 'Tuesday' },
    { weekday: 3, label: 'Wednesday' },
    { weekday: 4, label: 'Thursday' },
    { weekday: 5, label: 'Friday', closed: true },
];

// Column headings for the pickup grid on narrow screens (Bangladesh time).
export const PICKUP_SLOT_SHORT_LABELS = { '10-12': '10–12', '12-14': '12–2', '14-16': '2–4', '16-18': '4–6' };

// 0-4: the heat step for a count, relative to the busiest cell. Zero is
// always step 0 so "none" never looks like "a few".
export function heatStep(count, max) {
    if (!count || !max) return 0;
    return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}
