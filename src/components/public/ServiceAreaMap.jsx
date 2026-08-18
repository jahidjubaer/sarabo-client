import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hasServiceAreaCoordinates } from '../../utils/serviceAreaPresentation';

// Coverage map for the public Service Areas page.
//
// EVERY MARKER IS REAL. Each pin is placed from the latitude/longitude already
// stored against that district in serviceAreas.json - the same file that powers
// the create-request selectors. Nothing is geocoded, nothing is placed by hand,
// and an area without well-formed coordinates is simply not plotted rather than
// being guessed at.
//
// WHY LEAFLET. The previous OpenStreetMap `export/embed.html` iframe can show
// exactly one marker and cannot be moved from our side, so it could not show
// where Sarabo actually operates, and search could not move the map. Leaflet is
// the smallest thing that does both: no API key, no account, same OpenStreetMap
// tiles.
//
// KEYBOARD. Markers are deliberately NOT focusable (`keyboard: false`). Sixty-
// four focusable pins would bury the rest of the page under tab stops, and the
// district list beside the map is the operable equivalent - every marker has a
// list button that selects the same area.
const DEFAULT_ZOOM = 11;
const FIT_PADDING = [28, 28];

// Marigold dot for a listed area, and a larger pin for the one in focus. Built
// as divIcons so there is no bundled image path to break and both states take
// their colour from the design tokens.
const dotIcon = L.divIcon({
    className: '',
    html: '<span class="block size-3 rounded-full border-2 border-ds-ink/70 bg-ds-action shadow"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const focusIcon = L.divIcon({
    className: '',
    html: '<span class="block size-5 rounded-full border-[3px] border-ds-ink bg-ds-action shadow-lg ring-4 ring-ds-action/30"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function ServiceAreaMap({ areas, focus, onSelect, className = '' }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    // onSelect is called from Leaflet handlers that are bound once per marker
    // rebuild; a ref keeps those handlers on the current callback without
    // re-creating every marker whenever the parent re-renders.
    const selectRef = useRef(onSelect);
    useEffect(() => { selectRef.current = onSelect; }, [onSelect]);

    // Create the map once. Leaflet owns this DOM subtree from here on, so React
    // must never render children into it.
    useEffect(() => {
        const map = L.map(containerRef.current, {
            zoomControl: true,
            scrollWheelZoom: false, // page scroll must not be hijacked by the map
            attributionControl: true,
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        map.setView([23.685, 90.356], 7);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // The panel is inside a responsive grid, so its box can settle after
        // Leaflet has already measured it once.
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            layerRef.current = null;
        };
    }, []);

    // Redraw the markers whenever the visible set or the focused area changes.
    useEffect(() => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;

        const plottable = (Array.isArray(areas) ? areas : []).filter(hasServiceAreaCoordinates);
        layer.clearLayers();

        for (const area of plottable) {
            const isFocus = focus?.district === area.district && focus?.region === area.region;
            L.marker([area.latitude, area.longitude], {
                icon: isFocus ? focusIcon : dotIcon,
                keyboard: false,
                title: `${area.district}, ${area.region}`,
                zIndexOffset: isFocus ? 1000 : 0,
            })
                .on('click', () => selectRef.current?.(area))
                .addTo(layer);
        }

        const animate = !prefersReducedMotion();
        if (focus && hasServiceAreaCoordinates(focus)) {
            // The searched or selected district: go to it directly.
            map.flyTo([focus.latitude, focus.longitude], DEFAULT_ZOOM, { animate, duration: 0.8 });
        } else if (plottable.length > 0) {
            // No focus: frame everything currently listed.
            map.flyToBounds(
                L.latLngBounds(plottable.map((area) => [area.latitude, area.longitude])),
                { padding: FIT_PADDING, animate, duration: 0.8, maxZoom: 12 }
            );
        }
    }, [areas, focus]);

    // The background is forced (`bg-ds-muted!`) because leaflet.css paints
    // .leaflet-container a fixed light grey, which shows through as a pale slab
    // on a dark page wherever a tile has not arrived yet. The token has to win
    // whichever stylesheet the bundler emits last.
    return (
        <div
            ref={containerRef}
            role="application"
            aria-label={focus
                ? `Map showing the ${focus.district} service area`
                : 'Map showing every listed Sarabo service area'}
            className={`z-0 h-[22rem] w-full rounded-ds-lg border border-ds-border bg-ds-muted! sm:h-[26rem] lg:h-[32rem] ${className}`}
        />
    );
}

export default ServiceAreaMap;
