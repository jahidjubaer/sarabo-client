import { humanizeSlug } from './serviceDefinitionCatalog';
import { formatMoney } from './currency';
import { getStatusPresentation } from '../config/statusPresentation';

// Admin, PRESENTATION-ONLY helpers for the redesigned operations dashboard +
// management tables (Phase 7.5). Everything is derived from data the existing
// admin APIs already return - no new endpoints, no changes to any record or to
// assignment/role/status semantics.

export const ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Admin' };
export const ROLE_FILTER_OPTIONS = [
    { value: 'all', label: 'All roles' },
    { value: 'user', label: 'Customer' },
    { value: 'rider', label: 'Technician' },
    { value: 'admin', label: 'Admin' },
];

// Technician workStatus wording is display-only - the stored 'in_delivery'
// predates the repair rename and must never be shown to an admin as-is.
export const WORK_STATUS_LABELS = { available: 'Available', in_delivery: 'On a repair' };
export function getWorkStatusLabel(status) {
    return WORK_STATUS_LABELS[status] || (status ? humanizeSlug(status) : 'Unknown');
}
export function getWorkStatusTone(status) {
    if (status === 'available') return 'success';
    if (status === 'in_delivery') return 'accent';
    return 'neutral';
}

export function getRoleLabel(role) {
    return ROLE_LABELS[role] || role || 'Unknown';
}
export function getRoleTone(role) {
    if (role === 'admin') return 'accent';
    if (role === 'rider') return 'info';
    return 'neutral';
}

// ---- Dashboard metrics from the authoritative status-stats aggregate ----
// stats: [{ status, count }] from GET /parcels/delivery-status/stats.
const ACTIVE_STATUSES = new Set([
    'driver_assigned', 'rider_arriving', 'parcel_picked_up', 'inspection_completed',
    'quote_submitted', 'quote_approved', 'payment_completed', 'repair_in_progress',
]);
const COMPLETED_STATUSES = new Set(['repair_completed', 'parcel_delivered']);
const CLOSED_STATUSES = new Set(['cancelled', 'quote_rejected']);

export function summarizeStatusStats(stats) {
    const list = Array.isArray(stats) ? stats : [];
    let total = 0;
    let awaitingAssignment = 0;
    let active = 0;
    let completed = 0;
    let closed = 0;
    for (const row of list) {
        const status = row?.status || row?._id;
        const count = Number(row?.count) || 0;
        total += count;
        if (status === 'pending-pickup') awaitingAssignment += count;
        else if (ACTIVE_STATUSES.has(status)) active += count;
        else if (COMPLETED_STATUSES.has(status)) completed += count;
        else if (CLOSED_STATUSES.has(status)) closed += count;
    }
    return { total, awaitingAssignment, active, completed, closed };
}

// Bar-chart series for the status distribution. Uses the canonical label + a
// theme-token colour per status tone (so it themes with light/dark).
const TONE_COLOR_VAR = {
    neutral: 'var(--ds-muted-foreground)',
    info: 'var(--ds-info)',
    success: 'var(--ds-success)',
    warning: 'var(--ds-warning)',
    danger: 'var(--ds-destructive)',
    accent: 'var(--ds-primary)',
};
export function toneColorVar(tone) {
    return TONE_COLOR_VAR[tone] || TONE_COLOR_VAR.neutral;
}

export function statusChartData(stats) {
    const list = Array.isArray(stats) ? stats : [];
    return list
        .map((row) => {
            const status = row?.status || row?._id;
            const presentation = getStatusPresentation(status);
            return { key: status, label: presentation.label, value: Number(row?.count) || 0, fill: toneColorVar(presentation.tone) };
        })
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value);
}

// Requests-by-product-category from already-loaded requests.
export function categoryChartData(requests, limit = 6) {
    const counts = new Map();
    for (const request of Array.isArray(requests) ? requests : []) {
        const slug = request?.product?.categorySlug;
        if (!slug) continue;
        counts.set(slug, (counts.get(slug) || 0) + 1);
    }
    return [...counts.entries()]
        .map(([slug, value]) => ({ key: slug, label: humanizeSlug(slug), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

// ---- Currency-safe payment grouping ----
// NEVER combines currencies. Returns one row per stored currency with its own
// count and its own formatted total (via the shared formatMoney, no FX).
export function groupPaymentsByCurrency(payments) {
    const groups = new Map();
    for (const payment of Array.isArray(payments) ? payments : []) {
        const currency = (typeof payment?.currency === 'string' ? payment.currency : '').toUpperCase() || 'UNKNOWN';
        const amount = Number(payment?.amount) || 0;
        const existing = groups.get(currency) || { currency, count: 0, total: 0 };
        existing.count += 1;
        existing.total += amount;
        groups.set(currency, existing);
    }
    return [...groups.values()]
        .map((group) => ({ ...group, formattedTotal: formatMoney(group.total, group.currency) || `${group.total} ${group.currency}` }))
        .sort((a, b) => b.count - a.count);
}

// ---- Technicians ----
export function summarizeTechnicians(riders) {
    const list = Array.isArray(riders) ? riders : [];
    let approved = 0;
    let pending = 0;
    let available = 0;
    for (const rider of list) {
        if (rider?.status === 'approved') approved += 1;
        if (rider?.status === 'pending') pending += 1;
        if (rider?.workStatus === 'available') available += 1;
    }
    return { total: list.length, approved, pending, available };
}

// Compact expertise chips from a rider's expertise array. Never dumps raw JSON.
export function getExpertiseBadges(rider) {
    const expertise = Array.isArray(rider?.expertise) ? rider.expertise : [];
    return expertise
        .filter((entry) => entry && entry.productCategorySlug)
        .map((entry) => ({
            key: entry.productCategorySlug,
            label: humanizeSlug(entry.productCategorySlug),
            level: entry.level ? humanizeSlug(entry.level) : null,
        }));
}

// ---- Assignment recommendation presentation ----
// Turns the server's terse recommendationReasons ("expertise:expert",
// "serviceArea:same_district", "experience:3yrs", "completedRepairs:5") into
// short human chips. Unknown formats fall back to a humanized token.
const SERVICE_AREA_LABELS = { same_district: 'Same district', same_region: 'Same region', outside: 'Outside area' };
export function formatRecommendationReasons(reasons) {
    return (Array.isArray(reasons) ? reasons : []).map((reason) => {
        const [kind, rest] = String(reason).split(':');
        if (kind === 'expertise') return `${humanizeSlug(rest || '')} expertise`;
        if (kind === 'serviceArea') return SERVICE_AREA_LABELS[rest] || humanizeSlug(rest || '');
        if (kind === 'experience') return `${rest} experience`;
        if (kind === 'completedRepairs') return `${rest} completed`;
        return humanizeSlug(String(reason));
    });
}

export function getServiceAreaLabel(matchLevel) {
    return SERVICE_AREA_LABELS[matchLevel] || (matchLevel ? humanizeSlug(matchLevel) : '');
}
