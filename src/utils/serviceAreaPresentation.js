// Pure presentation helpers for the public Service Areas page (Phase 7.9).
// Operate entirely on the existing local serviceAreas.json data (the same
// source that powers the create-request region/district selectors) - no
// backend endpoint, no invented coverage. Display-only: never mutates the
// data and never claims live availability.

function isArea(area) {
    return area && typeof area.region === 'string' && typeof area.district === 'string';
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

// --- Covered sub-areas ("places") -------------------------------------------
//
// Each district may also carry `covered_area_points`: the latitude/longitude of
// its covered sub-areas (Ambarkhana, Zindabazar, ...), looked up once from
// OpenStreetMap and kept only when the result lies inside that same district.
// A sub-area without a point is still listed and searchable; it simply falls
// back to its district's pin.
export function getAreaPoints(area) {
    return (Array.isArray(area?.covered_area_points) ? area.covered_area_points : [])
        .filter((point) => point && typeof point.name === 'string' && hasServiceAreaCoordinates(point));
}

// Sub-areas whose own name contains the query, as { area, point } pairs -
// best first: exact name, then name starting with the query, then the rest.
export function findPlaceMatches(areas, query) {
    const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
    if (q.length < 2) return [];
    const rank = (name) => (name === q ? 0 : name.startsWith(q) ? 1 : 2);
    return (Array.isArray(areas) ? areas : [])
        .filter(isArea)
        .flatMap((area) => getAreaPoints(area).map((point) => ({ area, point })))
        .filter(({ point }) => point.name.toLowerCase().includes(q))
        .sort((a, b) => rank(a.point.name.toLowerCase()) - rank(b.point.name.toLowerCase())
            || a.point.name.localeCompare(b.point.name));
}

// What a typed search should open: { area, point } when the query names a
// sub-area ("ambarkhana" -> that spot in Sylhet), { area, point: null } for a
// district, or null. A district's own name wins over a sub-area of the same
// name, so "Sylhet" still means the district.
export function resolveSearch(areas, query) {
    const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
    if (!q) return null;
    const list = filterServiceAreas(areas, q);
    const district = list.filter(hasServiceAreaCoordinates).find((area) => area.district.toLowerCase() === q);
    if (district) return { area: district, point: null };

    const place = findPlaceMatches(areas, q)[0];
    if (place && place.point.name.toLowerCase().startsWith(q)) return place;

    const fallback = findSearchTarget(list, q);
    return fallback ? { area: fallback, point: null } : null;
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
