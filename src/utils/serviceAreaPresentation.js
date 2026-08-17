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

// Smallest box containing every plottable area, with a little padding so points
// are not welded to the frame edge. A single area gets a fixed pad instead of a
// zero-size box (which the tile server would render at absurd zoom).
export function getServiceAreaBounds(areas) {
    const points = (Array.isArray(areas) ? areas : []).filter(hasServiceAreaCoordinates);
    if (points.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const point of points) {
        minLat = Math.min(minLat, point.latitude);
        maxLat = Math.max(maxLat, point.latitude);
        minLon = Math.min(minLon, point.longitude);
        maxLon = Math.max(maxLon, point.longitude);
    }

    const latPad = Math.max((maxLat - minLat) * 0.12, 0.12);
    const lonPad = Math.max((maxLon - minLon) * 0.12, 0.12);

    return {
        minLat: Math.max(minLat - latPad, -90),
        maxLat: Math.min(maxLat + latPad, 90),
        minLon: Math.max(minLon - lonPad, -180),
        maxLon: Math.min(maxLon + lonPad, 180),
        count: points.length,
    };
}

// OpenStreetMap's own embed endpoint: no API key, no SDK, no tracking script -
// just a bounding box. A marker is added ONLY for a single explicitly selected
// district, whose coordinate is real; a whole-region view carries no pins,
// because the file has no coordinate for a region as a whole and inventing one
// would imply precision that does not exist.
export function buildServiceAreaMapUrl(bounds, marker) {
    if (!bounds) return null;
    const bbox = [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat]
        .map((value) => value.toFixed(4))
        .join(',');
    const params = new URLSearchParams({ bbox, layer: 'mapnik' });
    if (hasServiceAreaCoordinates(marker)) {
        params.set('marker', `${marker.latitude.toFixed(4)},${marker.longitude.toFixed(4)}`);
    }
    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
