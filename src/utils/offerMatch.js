// Smarter matching (server: services/offerRanking.js). Each waiting offer
// carries `match: { score, rank, recommended, reasons: [{ code, value? }] }`.
// Pure helpers for showing it.

export const OFFER_SORTS = [
    { value: 'best', label: 'Best match' },
    { value: 'price', label: 'Lowest price' },
    { value: 'newest', label: 'Newest' },
];

function minutesLabel(minutes) {
    if (minutes < 60) return `${Math.max(minutes, 1)} min`;
    const hours = Math.round(minutes / 60);
    return `${hours} hr${hours === 1 ? '' : 's'}`;
}

// The short, factual line for one reason code, or null for an unknown code.
export function reasonLabel(reason) {
    switch (reason?.code) {
        case 'top_rated': return `Rated ${reason.value}★`;
        case 'reliable': return `${reason.value} repairs, no missed pickups`;
        case 'lowest_price': return 'Lowest estimate';
        case 'same_district': return 'In your district';
        case 'fast_reply': return `Usually replies in ${minutesLabel(reason.value)}`;
        default: return null;
    }
}

const midpoint = (a) => (a.estimateMin + a.estimateMax) / 2;
const rankOf = (a) => (Number.isFinite(a.match?.rank) ? a.match.rank : Number.MAX_SAFE_INTEGER);

export function sortOffers(offers, sort) {
    const list = [...offers];
    if (sort === 'price') return list.sort((a, b) => (midpoint(a) - midpoint(b)) || (a.inspectionFee - b.inspectionFee) || (rankOf(a) - rankOf(b)));
    if (sort === 'newest') return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.sort((a, b) => rankOf(a) - rankOf(b));
}
