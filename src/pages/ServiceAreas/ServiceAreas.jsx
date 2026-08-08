import { useMemo, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { Search, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/common/EmptyState';
import { buttonVariants } from '../../components/ui/button-variants';
import { groupServiceAreasByRegion, filterServiceAreas, countServiceAreas } from '../../utils/serviceAreaPresentation';
import { getRequestRepairAction } from '../../utils/publicContent';

// Public Service Areas page (Phase 7.9). Redesigned from the light-only Leaflet
// map into a searchable, region-grouped, dark-mode-coherent district list
// driven entirely by the existing local serviceAreas.json (the same data that
// powers the create-request selectors) - no backend endpoint, no invented
// coverage, no live-availability claim. Removing the map also drops the
// react-leaflet/leaflet dependencies.
const ServiceAreas = () => {
    const serviceAreas = useLoaderData();
    const [query, setQuery] = useState('');
    const requestAction = getRequestRepairAction();

    const total = useMemo(() => countServiceAreas(serviceAreas), [serviceAreas]);
    const groups = useMemo(() => groupServiceAreasByRegion(filterServiceAreas(serviceAreas, query)), [serviceAreas, query]);

    return (
        <div className="px-4 py-12 sm:px-6 lg:px-8">
            <header className="border-b border-ds-border pb-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-ds-primary">Coverage</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-ds-foreground sm:text-3xl">Currently supported service areas</h1>
                <p className="mt-3 max-w-2xl text-sm text-ds-muted-foreground">
                    Sarabo currently lists {total} service {total === 1 ? 'area' : 'areas'} across {groupServiceAreasByRegion(serviceAreas).length} regions. Search for your district or area below, then submit a repair request.
                </p>
            </header>

            <div className="mt-6 max-w-md">
                <label htmlFor="area-search" className="sr-only">Search service areas</label>
                <div className="relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                    <Input
                        id="area-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by region, district, or area"
                        className="pl-9"
                    />
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="mt-10">
                    <EmptyState
                        icon={MapPin}
                        title="No matching service area found"
                        description="We could not find a listed service area matching your search. Try a different district or area name."
                    />
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <section key={group.region} className="rounded-ds-lg border border-ds-border bg-ds-card p-5">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-ds-foreground">
                                <MapPin aria-hidden="true" className="size-4 text-ds-primary" /> {group.region}
                            </h2>
                            <ul className="mt-3 space-y-2">
                                {group.districts.map((district) => (
                                    <li key={district.district} className="text-sm">
                                        <span className="font-medium text-ds-foreground">{district.district}</span>
                                        {Array.isArray(district.covered_area) && district.covered_area.length > 0 && (
                                            <span className="text-ds-muted-foreground"> — {district.covered_area.join(', ')}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}

            <div className="mt-12 rounded-ds-lg border border-ds-border bg-ds-muted/40 p-6 text-center">
                <h2 className="text-lg font-semibold text-ds-foreground">Ready to book a repair in your area?</h2>
                <p className="mt-1 text-sm text-ds-muted-foreground">Submit a request and we’ll match you with an approved technician.</p>
                <Link to={requestAction.to} className={`${buttonVariants({ variant: 'default' })} mt-4`}>{requestAction.label}</Link>
            </div>
        </div>
    );
};

export default ServiceAreas;
