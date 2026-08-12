// Pure helpers for the Become-Technician expertise builder (Phase 8.7A).
//
// The server's canonical technician-expertise shape (see sarabo-server's
// utils/technicianExpertise.js) is:
//   [{ productCategorySlug, repairCategorySlugs: [...], level, experienceYears }]
// The applicant never types a free-text skill and never picks a "level"
// directly - they choose canonical product categories (from the public
// service-definitions catalogue), the repair categories they handle within
// each, and their years of experience. The level is DERIVED from the years
// using the same experience bands the server validates against, so a submitted
// entry can never fail the server's level/experience consistency check.
//
// This module is framework-free and does no fetching - it only transforms
// already-fetched service definitions and the applicant's selections into the
// canonical payload, and validates those selections for UX. The server remains
// the authority: it re-validates every value against the canonical taxonomy.

export const EXPERTISE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
export const MIN_EXPERIENCE_YEARS = 0;
export const MAX_EXPERIENCE_YEARS = 50;

// Mirrors sarabo-server's EXPERIENCE_BANDS exactly:
//   beginner 0<=y<1, intermediate 1<=y<3, advanced 3<=y<7, expert 7<=y<=50.
// Returns null for anything that is not a finite number in [0, 50].
export function deriveLevelForYears(years) {
    const y = Number(years);
    if (!Number.isFinite(y) || y < MIN_EXPERIENCE_YEARS || y > MAX_EXPERIENCE_YEARS) return null;
    if (y < 1) return 'beginner';
    if (y < 3) return 'intermediate';
    if (y < 7) return 'advanced';
    return 'expert';
}

export function humanizeSlug(slug) {
    return String(slug || '')
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function isIntegerYears(value) {
    // A blank/whitespace string coerces to 0 via Number(); require an explicit
    // value so "didn't enter years" is not silently treated as 0 (beginner).
    if (value === '' || value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    const y = Number(value);
    return Number.isInteger(y) && y >= MIN_EXPERIENCE_YEARS && y <= MAX_EXPERIENCE_YEARS;
}

// `selections` is a plain object keyed by productCategorySlug; each value is
// { repairSlugs: string[], experienceYears: number|string }. Only products the
// applicant actually engaged with appear as keys. A product only becomes a real
// expertise entry when it has at least one repair category selected.
function selectedProductEntries(selections) {
    if (!selections || typeof selections !== 'object') return [];
    return Object.entries(selections)
        .filter(([slug, value]) => slug && value && Array.isArray(value.repairSlugs) && value.repairSlugs.length > 0);
}

// Builds the canonical, de-duplicated expertise array from the applicant's
// selections. Repair slugs are de-duplicated within an entry; products are
// unique by construction (object keys). Never mutates its input. Entries with
// an out-of-range/non-integer year get a null level, which
// validateExpertiseSelections rejects before this is ever submitted.
export function buildExpertiseFromSelections(selections) {
    return selectedProductEntries(selections).map(([productCategorySlug, value]) => ({
        productCategorySlug,
        repairCategorySlugs: [...new Set(value.repairSlugs)],
        level: deriveLevelForYears(value.experienceYears),
        experienceYears: Number(value.experienceYears),
    }));
}

// UX-only validation (the server re-validates authoritatively). Returns
// { valid: true } or { valid: false, message }.
export function validateExpertiseSelections(selections) {
    const entries = selectedProductEntries(selections);
    if (entries.length === 0) {
        return { valid: false, message: 'Select at least one product category and the repairs you handle.' };
    }
    for (const [slug, value] of entries) {
        if (!isIntegerYears(value.experienceYears)) {
            return { valid: false, message: `Enter whole years of experience (0–${MAX_EXPERIENCE_YEARS}) for ${humanizeSlug(slug)}.` };
        }
    }
    return { valid: true };
}

// Readable summary chips for a set of selections, e.g. "Smartphone · Advanced".
export function describeExpertiseSelections(selections) {
    return buildExpertiseFromSelections(selections).map((entry) => ({
        key: entry.productCategorySlug,
        label: humanizeSlug(entry.productCategorySlug),
        level: entry.level ? humanizeSlug(entry.level) : null,
        repairCount: entry.repairCategorySlugs.length,
    }));
}

// Assembles the exact POST /technicians body. Deliberately carries ONLY the
// applicant profile fields plus the canonical expertise array - never
// workStatus, status, role, technicianId, or any operational/authoritative field
// (those are server-owned; see sarabo-server's APPLICATION_ALLOWED_FIELDS).
export function buildTechnicianApplicationPayload(profile, selections) {
    const p = profile || {};
    return {
        name: p.name,
        email: p.email,
        region: p.region,
        district: p.district,
        address: p.address,
        nid: p.nid,
        expertise: buildExpertiseFromSelections(selections),
    };
}
