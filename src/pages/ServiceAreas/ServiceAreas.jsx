import { useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { Search, MapPin, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import CTABand from '../../components/public/CTABand';
import ServiceAreaMap from '../../components/public/ServiceAreaMap';
import {
    filterServiceAreas, countServiceAreas, hasServiceAreaCoordinates,
    listServiceRegions, findSearchTarget,
} from '../../utils/serviceAreaPresentation';
import { cn } from '../../lib/utils';

// A district is identified by region + district, the pair the file itself is
// keyed on - never by an index, which search would shuffle.
const areaKey = (area) => `${area.region}::${area.district}`;
const ALL_REGIONS = 'all';

// Public Service Areas page.
//
// DATA UNCHANGED. Still driven entirely by the existing serviceAreas.json
// route-loader data - the same file that powers the create-request selectors.
// No backend endpoint, no invented coverage, no live-availability claim, and no
// "nationwide" wording: the page states exactly what the source file lists.
//
// MAP-LED. Every listed area is a marker on the map, and the search box now
// moves the map as well as filtering the list: type a district and the map
// flies to it. Selection is derived rather than stored, so the map can never
// point at something the list has filtered away.
//
// The counts are computed from the data at render time, so they cannot drift
// from it. They are descriptive, not a marketing figure.
const ServiceAreas = () => {
    const serviceAreas = useLoaderData();
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState(ALL_REGIONS);
    const [selectedKey, setSelectedKey] = useState(null);

    const total = useMemo(() => countServiceAreas(serviceAreas), [serviceAreas]);
    const regions = useMemo(() => listServiceRegions(serviceAreas), [serviceAreas]);

    const matches = useMemo(() => {
        const searched = filterServiceAreas(serviceAreas, query);
        return region === ALL_REGIONS ? searched : searched.filter((area) => area.region === region);
    }, [serviceAreas, query, region]);

    // What the map points at. An explicit click wins; otherwise a search picks
    // its own best match. Both are re-derived from the visible list, so a
    // selection that has been filtered out simply stops being the focus.
    const focus = useMemo(() => {
        const clicked = matches.find((area) => areaKey(area) === selectedKey);
        if (clicked && hasServiceAreaCoordinates(clicked)) return clicked;
        return findSearchTarget(matches, query);
    }, [matches, selectedKey, query]);

    const hasFilters = query.trim() !== '' || region !== ALL_REGIONS;
    const resetFilters = () => { setQuery(''); setRegion(ALL_REGIONS); setSelectedKey(null); };

    return (
        <div>
            <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 sm:pt-8 lg:px-8">
                <header className="tech-grid-pattern border border-ds-ink-foreground/15 bg-ds-ink px-6 py-12 text-ds-ink-foreground sm:rounded-ds-xl sm:px-10 lg:px-14">
                    <p className="ds-label text-ds-action">Coverage</p>
                    <h1 className="mt-4 text-title text-ds-ink-foreground">Where Sarabo currently operates</h1>
                    <p className="mt-3 max-w-lg text-body-sm text-ds-ink-foreground/70">
                        <span className="ds-numeric">{total}</span> service {total === 1 ? 'area' : 'areas'} listed
                        across <span className="ds-numeric">{regions.length}</span>{' '}
                        {regions.length === 1 ? 'region' : 'regions'}. Search for your district and the map will go
                        straight to it.
                    </p>
                </header>
            </div>

            <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                {/* Map-led. DOM order is search, map, then results - the reading
                    order asked for on a phone. On lg the map and the results sit
                    side by side, so nothing is read out of sequence at a width
                    where only one of them is visible. */}
                <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
                    <div className="min-w-0 lg:order-2 lg:sticky lg:top-24">
                        <ServiceAreaMap
                            areas={matches}
                            focus={focus}
                            onSelect={(area) => setSelectedKey(areaKey(area))}
                        />
                        <p className="mt-2 text-micro text-ds-muted-foreground">
                            {focus
                                ? `Pin shows the listed centre of ${focus.district}, not a branch address.`
                                : 'Every marker is a listed service area. Search or pick a district to zoom to it.'}
                        </p>
                    </div>

                    <div className="min-w-0 lg:order-1">
                        <div className="flex h-12 items-center gap-3 rounded-ds border border-ds-border bg-ds-card px-4 focus-within:border-ds-primary">
                            <Search aria-hidden="true" className="size-4 shrink-0 text-ds-muted-foreground" />
                            <label htmlFor="area-search" className="sr-only">Search service areas</label>
                            <input
                                id="area-search"
                                type="search"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setSelectedKey(null); }}
                                placeholder="Search by region, district, or area"
                                className="w-full bg-transparent text-body-sm text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none"
                            />
                        </div>

                        {/* Region filter, derived from the data rather than a
                            hardcoded list. */}
                        <div role="group" aria-label="Filter by region" className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                aria-pressed={region === ALL_REGIONS}
                                onClick={() => { setRegion(ALL_REGIONS); setSelectedKey(null); }}
                                className={cn(
                                    'focus-ring min-h-8 rounded-full border px-3.5 text-body-sm transition-colors',
                                    region === ALL_REGIONS
                                        ? 'border-ds-primary bg-ds-primary font-semibold text-ds-primary-foreground'
                                        : 'border-ds-border text-ds-muted-foreground hover:text-ds-foreground'
                                )}
                            >
                                All regions
                            </button>
                            {regions.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    aria-pressed={region === name}
                                    onClick={() => { setRegion(region === name ? ALL_REGIONS : name); setSelectedKey(null); }}
                                    className={cn(
                                        'focus-ring min-h-8 rounded-full border px-3.5 text-body-sm transition-colors',
                                        region === name
                                            ? 'border-ds-primary bg-ds-primary font-semibold text-ds-primary-foreground'
                                            : 'border-ds-border text-ds-muted-foreground hover:text-ds-foreground'
                                    )}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <p className="ds-label text-ds-muted-foreground" aria-live="polite">
                                {hasFilters
                                    ? `${matches.length} ${matches.length === 1 ? 'area' : 'areas'} matching`
                                    : `All ${total} service ${total === 1 ? 'area' : 'areas'}`}
                            </p>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="focus-ring inline-flex min-h-6 items-center gap-1.5 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline"
                                >
                                    <X aria-hidden="true" className="size-3.5" /> Clear
                                </button>
                            )}
                        </div>

                        {matches.length === 0 ? (
                            <div className="mt-4">
                                <EmptyState
                                    icon={MapPin}
                                    title="No matching service area found"
                                    description="We could not find a listed service area matching your search. Try a different district or area name."
                                />
                            </div>
                        ) : (
                            <ul className="mt-4 max-h-[32rem] overflow-y-auto rounded-ds-lg border border-ds-border bg-ds-card p-2">
                                {matches.map((area) => {
                                    const key = areaKey(area);
                                    const isFocus = focus && areaKey(focus) === key;
                                    const mappable = hasServiceAreaCoordinates(area);
                                    const body = (
                                        <>
                                            <span className="flex min-w-0 flex-col">
                                                <span className="truncate text-body-sm font-semibold text-ds-foreground">{area.district}</span>
                                                {Array.isArray(area.covered_area) && area.covered_area.length > 0 && (
                                                    <span className="truncate text-micro text-ds-muted-foreground">
                                                        {area.covered_area.join(' · ')}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="ds-label shrink-0 text-ds-muted-foreground">{area.region}</span>
                                        </>
                                    );
                                    return (
                                        <li key={key}>
                                            {mappable ? (
                                                // Only a district that actually carries a
                                                // coordinate is offered as a map control.
                                                <button
                                                    type="button"
                                                    aria-pressed={!!isFocus}
                                                    aria-label={`Show ${area.district}, ${area.region} on the map`}
                                                    onClick={() => setSelectedKey(isFocus ? null : key)}
                                                    className={cn(
                                                        'focus-ring flex w-full items-center justify-between gap-3 rounded-ds border-l-2 px-3 py-2.5 text-left transition-colors',
                                                        isFocus
                                                            ? 'border-l-ds-action bg-ds-muted'
                                                            : 'border-l-transparent hover:bg-ds-muted/60'
                                                    )}
                                                >
                                                    {body}
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 border-l-2 border-l-transparent px-3 py-2.5">
                                                    {body}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            <CTABand
                eyebrow="In a listed area?"
                heading="Submit a repair request from your district."
                description="Pick your region and district in the request form, and an approved technician covering that area is assigned."
            />
        </div>
    );
};

export default ServiceAreas;
