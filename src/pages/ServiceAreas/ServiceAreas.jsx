import { useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { Search, MapPin } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import CTABand from '../../components/public/CTABand';
import { groupServiceAreasByRegion, filterServiceAreas, countServiceAreas } from '../../utils/serviceAreaPresentation';

// Public Service Areas page (Phase 7.9, restyled in Phase 5A).
//
// DATA UNCHANGED. Still driven entirely by the existing serviceAreas.json
// route-loader data - the same file that powers the create-request selectors.
// No backend endpoint, no invented coverage, no live-availability claim, and
// no "nationwide" wording: the page states exactly what the source file lists.
//
// The counts below are derived from that data at render time, so they cannot
// drift from it. They are descriptive, not a marketing figure.
//
// Search, region grouping and the empty state all keep their existing
// behaviour and helpers; only the presentation moved onto the service-spine
// system. The ink header carrying the search matches the tracking page, so the
// two "look something up" pages behave the same way.
const ServiceAreas = () => {
    const serviceAreas = useLoaderData();
    const [query, setQuery] = useState('');

    const total = useMemo(() => countServiceAreas(serviceAreas), [serviceAreas]);
    const allGroups = useMemo(() => groupServiceAreasByRegion(serviceAreas), [serviceAreas]);
    const groups = useMemo(
        () => groupServiceAreasByRegion(filterServiceAreas(serviceAreas, query)),
        [serviceAreas, query]
    );

    return (
        <div>
            <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 sm:pt-8 lg:px-8">
                <header className="tech-grid-pattern border border-ds-ink-foreground/15 bg-ds-ink px-6 py-12 text-ds-ink-foreground sm:rounded-ds-xl sm:px-10 lg:px-14">
                    <p className="ds-label text-ds-action">Coverage</p>
                    <h1 className="mt-4 text-title text-ds-ink-foreground">Where Sarabo currently operates</h1>
                    <p className="mt-3 max-w-lg text-body-sm text-ds-ink-foreground/70">
                        <span className="ds-numeric">{total}</span> service {total === 1 ? 'area' : 'areas'} listed
                        across <span className="ds-numeric">{allGroups.length}</span>{' '}
                        {allGroups.length === 1 ? 'region' : 'regions'}. Find your district, then submit a repair request.
                    </p>

                    <div className="mt-7 max-w-xl">
                        <label htmlFor="area-search" className="sr-only">Search service areas</label>
                        <div className="flex h-12 items-center gap-3 rounded-ds border border-ds-ink-foreground/25 bg-ds-ink-foreground/10 px-4 focus-within:border-ds-ink-foreground/50">
                            <Search aria-hidden="true" className="size-4 shrink-0 text-ds-ink-foreground/60" />
                            <input
                                id="area-search"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by region, district, or area"
                                className="w-full bg-transparent text-body-sm text-ds-ink-foreground placeholder:text-ds-ink-foreground/40 focus:outline-none"
                            />
                        </div>
                    </div>
                </header>
            </div>

            <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="mx-auto max-w-6xl">
                    <p className="ds-label text-ds-muted-foreground" aria-live="polite">
                        {query
                            ? `${groups.length} ${groups.length === 1 ? 'region' : 'regions'} matching “${query}”`
                            : `All ${allGroups.length} ${allGroups.length === 1 ? 'region' : 'regions'}`}
                    </p>

                    {groups.length === 0 ? (
                        <div className="mt-6">
                            <EmptyState
                                icon={MapPin}
                                title="No matching service area found"
                                description="We could not find a listed service area matching your search. Try a different district or area name."
                            />
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {groups.map((group) => (
                                <section key={group.region} className="rounded-ds-lg border border-ds-border bg-ds-card p-5">
                                    <h2 className="flex items-center gap-2 text-subhead text-ds-foreground">
                                        <MapPin aria-hidden="true" className="size-4 shrink-0 text-ds-primary" />
                                        {group.region}
                                    </h2>
                                    <ul className="mt-4 flex flex-col gap-3">
                                        {group.districts.map((district) => (
                                            <li key={district.district} className="border-b border-ds-border/70 pb-3 last:border-b-0 last:pb-0">
                                                <span className="block text-body-sm font-semibold text-ds-foreground">{district.district}</span>
                                                {Array.isArray(district.covered_area) && district.covered_area.length > 0 && (
                                                    <span className="mt-0.5 block text-micro text-ds-muted-foreground">
                                                        {district.covered_area.join(' · ')}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}
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
