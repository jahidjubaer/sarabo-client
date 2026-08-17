import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { getServiceAreaBounds, buildServiceAreaMapUrl, hasServiceAreaCoordinates } from '../../utils/serviceAreaPresentation';

// Map panel for the public Service Areas page.
//
// NO MAPPING DEPENDENCY AND NO API KEY. This is OpenStreetMap's own
// `export/embed.html` endpoint, which takes nothing but a bounding box - so the
// bundle gains no library, the page needs no token, and there is no third-party
// SDK to configure.
//
// EVERYTHING PLOTTED IS REAL. The bounding box is derived from the
// latitude/longitude already present in serviceAreas.json for the areas
// currently in view. A pin is drawn only when the visitor has selected one
// district, using that district's own coordinate. A region-wide or
// search-results view shows no pin at all, because the data has no coordinate
// for "a region" and a made-up centre would read as precision Sarabo has not
// claimed.
// The embed is a third-party page: its map measures itself once, when it loads,
// and we cannot reach into another origin to revalidate it afterwards. If the
// frame's box changes after that - which it does here, because the panel is in
// a two-column grid that settles after first layout - the map keeps drawing at
// the stale size and leaves dead space in the panel.
//
// So the frame's own width is measured and used in the iframe key: the embed
// reloads at whatever size it actually occupies. The first measurement is taken
// in a layout effect (synchronous, before paint) rather than waiting on the
// observer, so the map still appears in environments where ResizeObserver
// callbacks are throttled; the observer only handles later resizes. Rounding to
// whole pixels keeps sub-pixel reflow from thrashing the reload.
function useFrameWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        if (ref.current) setWidth(Math.round(ref.current.getBoundingClientRect().width));
    }, []);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.round(entry.contentRect.width));
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, width];
}

function ServiceAreaMap({ areas, selected, className = '' }) {
    const [frameRef, frameWidth] = useFrameWidth();
    const plottable = (Array.isArray(areas) ? areas : []).filter(hasServiceAreaCoordinates);
    const marker = hasServiceAreaCoordinates(selected) ? selected : null;
    const bounds = getServiceAreaBounds(marker ? [marker] : plottable);
    const src = buildServiceAreaMapUrl(bounds, marker);

    const title = marker
        ? `Map of the ${marker.district} service area`
        : `Map covering ${plottable.length} listed service ${plottable.length === 1 ? 'area' : 'areas'}`;

    return (
        <div className={`overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ds-border px-4 py-3">
                <p className="flex min-w-0 items-center gap-2 text-body-sm font-semibold text-ds-foreground">
                    <MapPin aria-hidden="true" className="size-4 shrink-0 text-ds-primary" />
                    <span className="truncate">{marker ? marker.district : 'Listed service areas'}</span>
                </p>
                {marker && (
                    <p className="ds-label shrink-0 text-ds-muted-foreground">
                        {marker.region}
                    </p>
                )}
            </div>

            {src ? (
                <>
                    <div ref={frameRef} className="h-72 w-full bg-ds-muted sm:h-80 lg:h-[26rem]">
                        <iframe
                            key={`${src}|${frameWidth}`}
                            src={src}
                            title={title}
                            referrerPolicy="no-referrer"
                            className="block size-full border-0"
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ds-border px-4 py-3">
                        <p className="text-micro text-ds-muted-foreground">
                            {marker
                                ? 'Pin shows the listed district centre, not a branch address.'
                                : 'Select a district to place its pin on the map.'}
                        </p>
                        <a
                            href="https://www.openstreetmap.org/copyright"
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring inline-flex min-h-6 items-center gap-1 rounded-ds text-micro text-ds-muted-foreground hover:text-ds-foreground hover:underline"
                        >
                            © OpenStreetMap contributors
                            <ExternalLink aria-hidden="true" className="size-3" />
                        </a>
                    </div>
                </>
            ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center sm:h-80 lg:h-[26rem]">
                    <p className="text-body-sm text-ds-muted-foreground">
                        No mapped coordinates are listed for the areas currently shown.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ServiceAreaMap;
