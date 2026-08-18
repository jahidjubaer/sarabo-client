import { humanizeSlug } from './serviceDefinitionCatalog';
import { formatMoney } from './currency';
import { getHandoverState } from './repairStage';

// Customer-facing, PRESENTATION-ONLY helpers for the redesigned dashboard +
// My Requests (Phase 7.3). Everything here is derived from data the list API
// already returns (GET /repair-requests) - no new endpoints, no per-request eligibility
// fetches, no changes to any record. Backend statuses are grouped for a
// friendlier customer view; the underlying values are never modified.

// Maps each backend deliveryStatus to a customer-friendly group. A pending
// post-repair handover is layered on through the shared handover utility below;
// it remains separate from the four-stage repair spine. All other in-flight
// states are "active"; terminal completions are "completed";
// declined/cancelled are "closed".
const STATUS_GROUP = {
    'pending-pickup': 'active',
    'driver_assigned': 'active',
    'rider_arriving': 'active',
    'parcel_picked_up': 'active',
    'inspection_completed': 'active',
    'quote_submitted': 'needs-action',
    'quote_approved': 'needs-action',
    'payment_completed': 'active',
    'repair_in_progress': 'active',
    'repair_completed': 'completed',
    'parcel_delivered': 'completed',
    'quote_rejected': 'closed',
    'cancelled': 'closed',
};

export const REQUEST_GROUPS = ['all', 'active', 'needs-action', 'completed', 'closed'];
export const GROUP_LABELS = { all: 'All', active: 'Active', 'needs-action': 'Needs Action', completed: 'Completed', closed: 'Closed' };
export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'status', label: 'By status' },
];

export function getRequestStatus(request) {
    return request?.deliveryStatus || 'pending-pickup';
}

export function getRequestGroup(request) {
    const handover = getHandoverState(request);
    if (handover && !handover.confirmed) return 'needs-action';
    return STATUS_GROUP[getRequestStatus(request)] || 'active';
}

// "Active" for the customer = anything still in flight, including states that
// need their action. Used for the active-repair snapshot + the Active count.
export function isActiveRequest(request) {
    const group = getRequestGroup(request);
    return group === 'active' || group === 'needs-action';
}

// Whether a Pay control may be OFFERED for a request in a list context.
//
// This deliberately mirrors the server's own rule (sarabo-server's
// services/paymentEligibility.js#getV2PaymentEligibility) rather than
// introducing a second notion of payability: paid wins over everything, and
// only an approved quote on a quote_approved request can be charged. The
// request detail page still asks the server outright via
// GET /repair-requests/:id/payment-eligibility - that endpoint remains the
// authority, and this is only the list-level guess about whether to show a
// button at all.
//
// The previous rule here was `!isPaid && !isCancelled`, which offered "Pay" on
// requests that had no quote yet, on declined quotes, and - because it read
// only paymentStatus - on repairs whose payment had succeeded but whose
// paymentStatus had not been the field consulted. Anything not explicitly
// payable is now not offered.
export function canOfferPayment(request) {
    if (!request) return false;
    if (request.isPaid === true) return false;
    if (request.paymentStatus === 'paid') return false;
    if (request.payment && request.payment.status === 'completed') return false;

    const status = getRequestStatus(request);
    if (status === 'cancelled' || status === 'quote_rejected') return false;
    // Past the payment stage means it was already paid for.
    if (['payment_completed', 'repair_in_progress', 'repair_completed', 'parcel_delivered'].includes(status)) return false;

    const quote = request.quote;
    if (!quote || quote.status !== 'approved') return false;
    return status === 'quote_approved';
}

// True once payment has succeeded, by any of the authoritative markers the
// server may have set. Used to show the paid presentation in place of a Pay
// control.
export function isRequestPaid(request) {
    if (!request) return false;
    if (typeof request.isPaid === 'boolean') return request.isPaid;
    if (request.paymentStatus === 'paid') return true;
    if (request.payment && request.payment.status === 'completed') return true;
    return ['payment_completed', 'repair_in_progress', 'repair_completed', 'parcel_delivered'].includes(getRequestStatus(request));
}

// Customer next-action derived only from existing request presentation state
// (never a per-request payment-eligibility fetch). Every destination is the
// request detail page, where the authoritative quote/payment/handover UI lives.
export function getRequestAction(request) {
    const status = getRequestStatus(request);
    if (!request?._id) return null;
    const to = `/dashboard/my-requests/${request._id}`;
    const handover = getHandoverState(request);
    if (handover && !handover.confirmed) return { kind: 'handover', label: 'Confirm device received', to };
    if (status === 'quote_submitted') return { kind: 'quote-review', label: 'Review quote', to };
    if (status === 'quote_approved') return { kind: 'payment', label: 'Complete payment', to };
    return null;
}

// Safe device/product identity from list-available fields only.
export function getProductSummary(request) {
    const device = (request?.deviceName || '').trim();
    const category = request?.product?.categorySlug ? humanizeSlug(request.product.categorySlug) : '';
    const brandModel = [request?.product?.brand, request?.product?.model].filter(Boolean).join(' ').trim();
    return { device: device || 'Repair request', category, brandModel };
}

// One device label for compact surfaces (admin tables, assignment lists) that
// have room for a single line rather than the three fields getProductSummary
// returns.
//
// `deviceName` is the LEGACY (v1) field and is absent on every v2 request, so
// reading it alone renders blank for essentially all current data - that is
// exactly the bug this exists to stop repeating. Preference order is most
// specific first: the v2 brand/model the customer actually entered, then the
// product category, then the legacy name, and only then a truthful fallback.
export function getDeviceLabel(request) {
    const brandModel = [request?.product?.brand, request?.product?.model].filter(Boolean).join(' ').trim();
    if (brandModel) return brandModel;
    if (request?.product?.categorySlug) return humanizeSlug(request.product.categorySlug);
    const legacy = (request?.deviceName || '').trim();
    if (legacy) return legacy;
    return 'Device not specified';
}

// Only an AUTHORITATIVE agreed price is returned - an approved quote's total in
// its own stored currency (via the shared formatMoney, no FX). Estimates and
// legacy costs are intentionally not surfaced here to avoid mixing/implying a
// final price. Returns a formatted string or null.
export function getAgreedPrice(request) {
    const quote = request?.quote;
    if (quote && quote.status === 'approved' && Number.isFinite(Number(quote.totalAmount))) {
        return formatMoney(quote.totalAmount, quote.currency) || null;
    }
    return null;
}

export function summarizeRequests(requests) {
    const list = Array.isArray(requests) ? requests : [];
    let active = 0;
    let needsAction = 0;
    let completed = 0;
    for (const request of list) {
        const group = getRequestGroup(request);
        if (group === 'active') active += 1;
        else if (group === 'needs-action') needsAction += 1;
        else if (group === 'completed') completed += 1;
    }
    return { total: list.length, active, needsAction, completed };
}

function byNewest(a, b) {
    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
}

// The single request to feature on the dashboard: the newest one that needs the
// customer's action if any, otherwise the newest active repair. Null when
// nothing is in flight.
export function selectActiveSnapshot(requests) {
    const ongoing = (Array.isArray(requests) ? requests : []).filter(isActiveRequest).sort(byNewest);
    const needing = ongoing.filter((request) => getRequestGroup(request) === 'needs-action');
    return needing[0] || ongoing[0] || null;
}

export function getRecentRequests(requests, count = 4) {
    return [...(Array.isArray(requests) ? requests : [])].sort(byNewest).slice(0, count);
}

// Case-insensitive, trimmed search over already-displayed fields only (device
// name, product category/brand/model, tracking id, service district/region).
export function requestMatchesSearch(request, query) {
    const needle = (query || '').trim().toLowerCase();
    if (!needle) return true;
    const { device, category, brandModel } = getProductSummary(request);
    const location = request?.serviceLocation || {};
    const haystack = [device, category, brandModel, request?.trackingId, location.district, location.region]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(needle);
}

// Pure filter + sort pipeline over already-loaded requests. Default preserves
// newest-first (the app's existing expected ordering).
export function applyRequestView(requests, { search = '', group = 'all', sort = 'newest' } = {}) {
    let list = (Array.isArray(requests) ? requests : []).filter((request) => requestMatchesSearch(request, search));
    if (group !== 'all') {
        list = list.filter((request) => getRequestGroup(request) === group);
    }
    if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    } else if (sort === 'status') {
        list = [...list].sort((a, b) => getRequestStatus(a).localeCompare(getRequestStatus(b)) || byNewest(a, b));
    } else {
        list = [...list].sort(byNewest);
    }
    return list;
}
