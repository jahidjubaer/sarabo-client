import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { ArrowRight, LayoutDashboard, MapPin, Search, X } from 'lucide-react';
import ServiceAreaMap from '../../components/public/ServiceAreaMap';
import { countServiceAreas, filterServiceAreas, findPlaceMatches, getAreaPoints, resolveSearch } from '../../utils/serviceAreaPresentation';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { shouldShowCreateRequestLink, getRequestRepairAction } from '../../utils/publicContent';
import { buttonVariants } from '../../components/ui/button-variants';
import { cn } from '../../lib/utils';

const areaKey = (area) => `${area.region}::${area.district}`;
const SEARCH_DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 8;
// Of those, at most this many are sub-areas, so districts are never crowded out.
const MAX_PLACE_SUGGESTIONS = 5;

// Public Service Areas page (Phase 2 refinement): search + a map that fills
// the screen. Nothing else competes with it.
//
//   - The search box is an ARIA combobox: typing lists matching districts,
//     arrow keys move through them, Enter picks one. It reaches every listed
//     district by keyboard, so it is also the accessible alternative to the map.
//   - Choosing a district (from the list or a pin) flies the map there and
//     opens a small panel over the map with the areas it covers and the action.
//   - While a search is active the map shows only the matching pins.
//   - Covered sub-areas are searchable too: "Ambarkhana" lists "Ambarkhana,
//     Sylhet" and choosing it zooms to that spot, not the district centre.
//     The area chips in the panel do the same.
//   - ?q= (from the homepage) pre-fills the search and opens the best match.
// Everything comes from serviceAreas.json via the route loader; nothing here
// claims live technician availability.
const ServiceAreas = () => {
    const serviceAreas = useLoaderData();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { role } = useRole();
    const listboxId = useId();

    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [listOpen, setListOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [initialTarget] = useState(() => resolveSearch(serviceAreas, initialQuery));
    const [selectedKey, setSelectedKey] = useState(initialTarget ? areaKey(initialTarget.area) : null);
    // Name of the covered sub-area in focus within the selected district, if any.
    const [selectedPlace, setSelectedPlace] = useState(initialTarget?.point?.name || null);
    const inputRef = useRef(null);
    const panelHeadingRef = useRef(null);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [query]);

    const total = countServiceAreas(serviceAreas);
    const matches = useMemo(
        () => filterServiceAreas(serviceAreas, debouncedQuery).sort((a, b) => a.district.localeCompare(b.district)),
        [serviceAreas, debouncedQuery]
    );
    const searching = debouncedQuery.trim() !== '';
    // Sub-areas first (they are the more specific answer), then districts.
    const suggestions = useMemo(() => {
        if (!searching) return [];
        const places = findPlaceMatches(serviceAreas, debouncedQuery)
            .slice(0, MAX_PLACE_SUGGESTIONS)
            .map(({ area, point }) => ({ key: `${areaKey(area)}::${point.name}`, area, place: point.name }));
        const districts = matches.map((area) => ({ key: areaKey(area), area, place: null }));
        return [...places, ...districts].slice(0, MAX_SUGGESTIONS);
    }, [searching, serviceAreas, debouncedQuery, matches]);
    const allAreas = useMemo(() => filterServiceAreas(serviceAreas, ''), [serviceAreas]);
    const selected = allAreas.find((area) => areaKey(area) === selectedKey) || null;
    // Covered sub-areas of the selected district that can be shown on the map.
    const mappedPlaces = useMemo(() => new Set(getAreaPoints(selected).map((point) => point.name)), [selected]);
    const showList = listOpen && searching;

    const showRequest = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    const choose = (area, place = null) => {
        setSelectedKey(areaKey(area));
        setSelectedPlace(place);
        setQuery(place || area.district);
        setDebouncedQuery(place || area.district);
        setListOpen(false);
        setActiveIndex(-1);
    };

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setListOpen(true);
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const active = suggestions[activeIndex];
            const pick = active ? { area: active.area, place: active.place } : resolveSearch(serviceAreas, query);
            if (pick) choose(pick.area, active ? pick.place : pick.point?.name || null);
        } else if (event.key === 'Escape') {
            setListOpen(false);
            setActiveIndex(-1);
        }
    };

    const clear = () => {
        setQuery('');
        setDebouncedQuery('');
        setSelectedKey(null);
        setSelectedPlace(null);
        setActiveIndex(-1);
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            <h1 id="page-title" tabIndex={-1} className="sr-only">Service areas</h1>

            {/* Search bar, floating over the top of the map. */}
            <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] px-4 sm:px-6 lg:px-8">
                <div className="pointer-events-auto relative mx-auto max-w-xl">
                    <label htmlFor="area-search" className="sr-only">Search a district, city or area</label>
                    <div className="flex h-14 items-center gap-3 rounded-full border border-ds-border bg-ds-card px-5 shadow-xl focus-within:ring-2 focus-within:ring-ds-ring">
                        <Search aria-hidden="true" className="size-5 shrink-0 text-ds-muted-foreground" />
                        <input
                            ref={inputRef}
                            id="area-search"
                            type="text"
                            role="combobox"
                            autoComplete="off"
                            aria-autocomplete="list"
                            aria-expanded={showList}
                            aria-controls={listboxId}
                            aria-activedescendant={showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
                            value={query}
                            onChange={(event) => { setQuery(event.target.value); setListOpen(true); setActiveIndex(-1); }}
                            onFocus={() => setListOpen(true)}
                            onBlur={() => setTimeout(() => setListOpen(false), 120)}
                            onKeyDown={onKeyDown}
                            placeholder={`Search ${total} districts or an area, e.g. Ambarkhana`}
                            className="min-w-0 flex-1 bg-transparent text-body text-ds-foreground outline-none placeholder:text-ds-muted-foreground"
                        />
                        {query && (
                            <button type="button" onClick={clear} aria-label="Clear search" className="focus-ring -mr-2 flex size-9 items-center justify-center rounded-full text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground">
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        )}
                    </div>

                    <ul
                        id={listboxId}
                        role="listbox"
                        aria-label="Matching districts and areas"
                        hidden={!showList}
                        className="absolute inset-x-0 top-16 max-h-80 overflow-y-auto rounded-ds-xl border border-ds-border bg-ds-popover p-1.5 shadow-xl"
                    >
                        {suggestions.length === 0 ? (
                            <li role="option" aria-disabled="true" aria-selected="false" className="px-4 py-3 text-body-sm text-ds-muted-foreground">No listed district or area matches.</li>
                        ) : suggestions.map(({ key, area, place }, index) => (
                            <li
                                key={key}
                                id={`${listboxId}-${index}`}
                                role="option"
                                aria-selected={index === activeIndex}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => choose(area, place)}
                                className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-ds-lg px-3 text-body-sm',
                                    index === activeIndex ? 'bg-ds-accent text-ds-accent-foreground' : 'text-ds-foreground hover:bg-ds-muted'
                                )}
                            >
                                <MapPin aria-hidden="true" className="size-4 shrink-0 text-ds-primary" />
                                <span className="font-semibold">{place || area.district}</span>
                                <span className="text-ds-muted-foreground">{place ? area.district : area.region}</span>
                            </li>
                        ))}
                    </ul>
                    <p role="status" className="sr-only">
                        {searching ? `${suggestions.length} match${suggestions.length === 1 ? '' : 'es'}.` : ''}
                    </p>
                </div>
            </div>

            <ServiceAreaMap
                areas={searching ? matches : allAreas}
                focus={selected}
                focusPlace={selected ? selectedPlace : null}
                onSelectPlace={(area, place) => setSelectedPlace(place)}
                onSelect={(area) => {
                    setSelectedKey(areaKey(area));
                    setSelectedPlace(null);
                    // After the panel renders, move focus to it so the change is announced.
                    requestAnimationFrame(() => panelHeadingRef.current?.focus({ preventScroll: true }));
                }}
                className="h-[calc(100svh-4rem)] min-h-[32rem]"
            />

            {/* Selected district: a compact panel over the map. */}
            {selected && (
                <section
                    aria-labelledby="selected-area-heading"
                    className="absolute inset-x-4 bottom-4 z-[1000] rounded-ds-xl border border-ds-border bg-ds-card p-5 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-96 lg:left-8"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 id="selected-area-heading" ref={panelHeadingRef} tabIndex={-1} className="text-heading text-ds-foreground outline-none">{selectedPlace || selected.district}</h2>
                            <p className="mt-0.5 text-body-sm text-ds-muted-foreground">
                                {selectedPlace
                                    ? `${selected.district}, ${selected.region} Division`
                                    : `${selected.city && selected.city !== selected.district ? `${selected.city}, ` : ''}${selected.region} Division`}
                            </p>
                        </div>
                        <button type="button" onClick={() => { setSelectedKey(null); setSelectedPlace(null); }} aria-label="Close district details" className="focus-ring -mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground">
                            <X aria-hidden="true" className="size-4" />
                        </button>
                    </div>
                    {Array.isArray(selected.covered_area) && selected.covered_area.length > 0 && (
                        <ul aria-label="Areas covered" className="mt-4 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                            {selected.covered_area.map((name) => (
                                <li key={name}>
                                    {mappedPlaces.has(name) ? (
                                        <button
                                            type="button"
                                            aria-pressed={name === selectedPlace}
                                            onClick={() => setSelectedPlace(name === selectedPlace ? null : name)}
                                            className={cn(
                                                'focus-ring block rounded-full px-2.5 py-1 text-micro font-semibold leading-5',
                                                name === selectedPlace ? 'bg-ds-primary text-ds-primary-foreground' : 'bg-ds-muted text-ds-foreground hover:bg-ds-accent'
                                            )}
                                        >
                                            {name}
                                        </button>
                                    ) : (
                                        <span className="block rounded-full bg-ds-muted px-2.5 py-1 text-micro font-semibold leading-5 text-ds-foreground">{name}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {showRequest ? (
                        <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action' }), 'mt-5 w-full')}>
                            {requestAction.label} <ArrowRight aria-hidden="true" />
                        </Link>
                    ) : (
                        <Link to="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'mt-5 w-full')}>
                            <LayoutDashboard aria-hidden="true" /> Open your dashboard
                        </Link>
                    )}
                </section>
            )}
        </div>
    );
};

export default ServiceAreas;
