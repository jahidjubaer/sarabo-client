// Pure presentation helpers for the public Service Areas page (Phase 7.9).
// Operate entirely on the existing local serviceAreas.json data (the same
// source that powers the create-request region/district selectors) - no
// backend endpoint, no invented coverage. Display-only: never mutates the
// data and never claims live availability.

function isArea(area) {
    return area && typeof area.region === 'string' && typeof area.district === 'string';
}

// Groups areas into region -> districts, both alphabetically sorted, so the
// page can render stable expandable region groups. Malformed rows are dropped
// rather than throwing.
export function groupServiceAreasByRegion(areas) {
    const map = new Map();
    for (const area of Array.isArray(areas) ? areas : []) {
        if (!isArea(area)) continue;
        if (!map.has(area.region)) map.set(area.region, []);
        map.get(area.region).push(area);
    }
    return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([region, districts]) => ({
            region,
            districts: districts.slice().sort((d1, d2) => d1.district.localeCompare(d2.district)),
        }));
}

// Case-insensitive search across region, district, city, and covered sub-areas.
// An empty query returns everything (no filtering).
export function filterServiceAreas(areas, query) {
    const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
    const list = Array.isArray(areas) ? areas : [];
    if (!q) return list.filter(isArea);
    return list.filter((area) => {
        if (!isArea(area)) return false;
        const haystack = [area.region, area.district, area.city, ...(Array.isArray(area.covered_area) ? area.covered_area : [])]
            .filter((v) => typeof v === 'string')
            .join(' ')
            .toLowerCase();
        return haystack.includes(q);
    });
}

// Count of valid, currently-listed service areas - used for a data-backed
// count in the copy instead of a hardcoded number.
export function countServiceAreas(areas) {
    return (Array.isArray(areas) ? areas : []).filter(isArea).length;
}

// --- Map support -----------------------------------------------------------
//
// serviceAreas.json already carries a real `latitude`/`longitude` per listed
// district, so the map is drawn from the same source as the list - no invented
// coordinates, no geocoding call, and no coverage claim beyond what the file
// lists. An area without well-formed numbers is simply not plotted.
export function hasServiceAreaCoordinates(area) {
    return Number.isFinite(area?.latitude) && Number.isFinite(area?.longitude);
}

// The distinct regions present in a set of areas, alphabetically - used for the
// region filter. Derived from the data, so a region added to the file appears
// on its own without a code change.
export function listServiceRegions(areas) {
    const regions = new Set();
    for (const area of Array.isArray(areas) ? areas : []) {
        if (isArea(area)) regions.add(area.region);
    }
    return [...regions].sort((a, b) => a.localeCompare(b));
}

// The area a search should jump to. Prefers a district whose own name matches
// (someone typing "Sylhet" means the district, not every area in the region),
// then falls back to the first match in the already-filtered list, so a search
// for a sub-area like "Uttara" still lands on the district that covers it.
export function findSearchTarget(matches, query) {
    const list = Array.isArray(matches) ? matches.filter(hasServiceAreaCoordinates) : [];
    if (list.length === 0) return null;

    const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
    if (!q) return null;

    return list.find((area) => area.district.toLowerCase() === q)
        || list.find((area) => area.district.toLowerCase().startsWith(q))
        || list[0];
}
