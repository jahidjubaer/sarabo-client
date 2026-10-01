import { humanizeSlug } from './serviceDefinitionCatalog';

// Open jobs board helpers (pure).
export function jobTitle(job) {
    const named = [job.product.brand, job.product.model].filter(Boolean).join(' ');
    return named || humanizeSlug(job.product.categorySlug);
}

export const DECLINE_REASONS = [
    { value: 'price', label: 'The estimate is too high' },
    { value: 'inspection_fee', label: 'The inspection fee is too high' },
    { value: 'other', label: 'Something else' },
];

// The public list and the technician's list have different shapes; the
// board's cards, filters and sorting work on this common one. `raw` keeps the
// original for the technician's offer sheet.
export function toBoardJob(job) {
    const mine = job.myApplication || null;
    const offers = typeof job.offers === 'number'
        ? job.offers
        : (job.otherApplications || 0) + (mine && mine.status === 'pending' ? 1 : 0);
    return {
        id: job.id,
        categorySlug: job.product.categorySlug,
        repairSlug: job.repairCategorySlug,
        brand: job.product.brand || null,
        model: job.product.model || null,
        region: job.region,
        district: job.district,
        pickupDate: job.pickupDate || (job.pickupSlot ? job.pickupSlot.date : null),
        pickupSlot: job.pickupSlot || null,
        priceMin: job.catalogueEstimate.min,
        priceMax: job.catalogueEstimate.max,
        currency: job.catalogueEstimate.currency,
        postedAt: job.postedAt || job.publishedAt || null,
        reposted: Boolean(job.reposted),
        offers,
        problem: job.problem || '',
        photoCount: job.photoCount || 0,
        maxInspectionFee: job.maxInspectionFee,
        invited: Boolean(job.invited),
        mine,
        raw: job,
    };
}

// Where the technician's own offer stands.
export function offerState(mine) {
    if (!mine) return 'none';
    if (mine.status === 'pending') return 'pending';
    if (mine.status === 'declined') return mine.canReoffer ? 'can-revise' : 'closed';
    return 'none';
}

export const JOB_SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'pickup', label: 'Pickup soonest' },
    { value: 'fewest-offers', label: 'Fewest offers' },
    { value: 'price-high', label: 'Highest price' },
];

export const JOB_FILTER_DEFAULTS = { q: '', region: 'all', device: 'all', repair: 'all', offers: 'all', mine: 'all', sort: 'newest' };

const time = (value) => (value ? new Date(value).getTime() : 0);

// Region, device and repair choices present in the loaded jobs, A-Z.
export function jobFilterOptions(jobs) {
    const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
        regions: unique(jobs.map((j) => j.region)),
        devices: unique(jobs.map((j) => j.categorySlug)),
        repairs: unique(jobs.map((j) => j.repairSlug)),
    };
}

export function filterJobs(jobs, filters) {
    const q = (filters.q || '').trim().toLowerCase();
    return jobs.filter((job) => {
        if (filters.region !== 'all' && job.region !== filters.region) return false;
        if (filters.device !== 'all' && job.categorySlug !== filters.device) return false;
        if (filters.repair !== 'all' && job.repairSlug !== filters.repair) return false;
        if (filters.offers === 'none' && job.offers > 0) return false;
        if (filters.mine === 'not-applied' && offerState(job.mine) !== 'none') return false;
        if (filters.mine === 'applied' && offerState(job.mine) === 'none') return false;
        if (q) {
            const text = [job.brand, job.model, job.district, job.region, humanizeSlug(job.categorySlug), humanizeSlug(job.repairSlug), job.problem]
                .filter(Boolean).join(' ').toLowerCase();
            if (!text.includes(q)) return false;
        }
        return true;
    });
}

export function sortJobs(jobs, sort) {
    const list = [...jobs];
    const newest = (a, b) => time(b.postedAt) - time(a.postedAt);
    if (sort === 'pickup') {
        // No pickup date goes last.
        return list.sort((a, b) => (a.pickupDate || '9999').localeCompare(b.pickupDate || '9999') || newest(a, b));
    }
    if (sort === 'fewest-offers') return list.sort((a, b) => a.offers - b.offers || newest(a, b));
    if (sort === 'price-high') return list.sort((a, b) => b.priceMax - a.priceMax || newest(a, b));
    return list.sort(newest);
}

export function countActiveJobFilters(filters) {
    return ['region', 'device', 'repair', 'offers', 'mine'].filter((key) => filters[key] !== 'all').length + (filters.q.trim() ? 1 : 0);
}
