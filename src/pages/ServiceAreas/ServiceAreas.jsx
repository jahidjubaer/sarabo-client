import { useMemo, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { MapPin, ArrowRight } from 'lucide-react';
import ServiceAreaMap from '../../components/public/ServiceAreaMap';
import { filterServiceAreas, listServiceRegions, findSearchTarget } from '../../utils/serviceAreaPresentation';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { shouldShowCreateRequestLink, getRequestRepairAction } from '../../utils/publicContent';
import { buttonVariants } from '../../components/ui/button-variants';
import { cn } from '../../lib/utils';
import { Select } from '../../components/ui/select';

const areaKey = (area) => `${area.region}::${area.district}`;
const controlClass = 'focus-ring mt-2 min-h-11 w-full min-w-0 rounded-ds border border-ds-border bg-ds-card px-3 text-body-sm text-ds-foreground';

const ServiceAreas = () => {
    const serviceAreas = useLoaderData();
    const { user } = useAuth();
    const { role } = useRole();
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState('all');
    const [selectedKey, setSelectedKey] = useState(null);
    const regions = useMemo(() => listServiceRegions(serviceAreas), [serviceAreas]);
    const matches = useMemo(() => filterServiceAreas(serviceAreas, query)
        .filter((area) => region === 'all' || area.region === region)
        .sort((a, b) => a.district.localeCompare(b.district)), [serviceAreas, query, region]);
    const selected = matches.find((area) => areaKey(area) === selectedKey) || null;
    const showRequest = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    const search = (value) => {
        setQuery(value);
        const results = filterServiceAreas(serviceAreas, value).filter((area) => region === 'all' || area.region === region);
        const target = findSearchTarget(results, value) || (value.trim() ? results[0] : null);
        setSelectedKey(target ? areaKey(target) : null);
    };
    const changeRegion = (value) => {
        setRegion(value);
        const results = filterServiceAreas(serviceAreas, query).filter((area) => value === 'all' || area.region === value);
        const target = value !== 'all' ? results[0] : findSearchTarget(results, query);
        setSelectedKey(target ? areaKey(target) : null);
    };
    const reset = () => { setQuery(''); setRegion('all'); setSelectedKey(null); };

    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <header className="max-w-2xl">
                <p className="ds-label text-ds-primary">Service areas</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ds-foreground sm:text-4xl">Find your district.</h1>
                <p className="mt-4 text-body text-ds-muted-foreground">Explore listed coverage and the areas within each district. Coverage listings do not indicate live Technician availability.</p>
            </header>

            <section aria-label="Explore service coverage" className="mt-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
                    <div className="min-w-0">
                        <label htmlFor="area-search" className="text-body-sm font-semibold text-ds-foreground">Search locations</label>
                        <input id="area-search" type="search" value={query} onChange={(event) => search(event.target.value)} placeholder="District, city or covered area" className={controlClass} />
                    </div>
                    <div className="min-w-0">
                        <label htmlFor="area-region" className="text-body-sm font-semibold text-ds-foreground">Region</label>
                        <Select id="area-region" value={region} onChange={(event) => changeRegion(event.target.value)} wrapperClassName="mt-2">
                            <option value="all">All regions</option>
                            {regions.map((name) => <option key={name} value={name}>{name}</option>)}
                        </Select>
                    </div>
                    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                        <label htmlFor="area-district" className="text-body-sm font-semibold text-ds-foreground">Select a district</label>
                        <Select id="area-district" value={selected ? areaKey(selected) : ''} onChange={(event) => setSelectedKey(event.target.value || null)} wrapperClassName="mt-2">
                            <option value="">Choose a location</option>
                            {matches.map((area) => <option key={areaKey(area)} value={areaKey(area)}>{area.district} — {area.region}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="my-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-body-sm text-ds-muted-foreground" role="status">{matches.length ? `${matches.length} listed districts match your controls.` : 'No matching locations. Try another search or show all areas.'}</p>
                    <button type="button" onClick={reset} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Show all areas</button>
                </div>
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="min-w-0">
                        <ServiceAreaMap areas={matches} focus={selected} onSelect={(area) => setSelectedKey(areaKey(area))} />
                        <p className="mt-3 text-micro text-ds-muted-foreground">Pins show listed district centres, not branches or exact coverage boundaries. Use the district selector without interacting with the map.</p>
                    </div>
                    <aside aria-labelledby="selected-area-heading" className="min-w-0 rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6">
                        <p className="ds-label text-ds-primary">Listed coverage</p>
                        <div aria-live="polite" aria-atomic="true" className="break-words">
                            <h2 id="selected-area-heading" className="mt-3 text-heading text-ds-foreground">{selected ? selected.district : 'Explore a location'}</h2>
                            {selected ? (
                                <>
                                    <dl className="mt-4 space-y-3 text-body-sm">
                                        <div><dt className="text-ds-muted-foreground">Region</dt><dd className="mt-1 text-ds-foreground">{selected.region}</dd></div>
                                        {selected.city && selected.city !== selected.district && <div><dt className="text-ds-muted-foreground">City</dt><dd className="mt-1 text-ds-foreground">{selected.city}</dd></div>}
                                        <div><dt className="text-ds-muted-foreground">Coverage status</dt><dd className="mt-1 text-ds-foreground">{selected.status === 'active' ? 'Active listing' : selected.status || 'Not specified'}</dd></div>
                                    </dl>
                                    <h3 className="mt-5 text-body-sm font-semibold text-ds-foreground">Covered areas</h3>
                                    {Array.isArray(selected.covered_area) && selected.covered_area.length ? (
                                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-body-sm text-ds-muted-foreground">{selected.covered_area.map((name) => <li key={name}>{name}</li>)}</ul>
                                    ) : <p className="mt-2 text-body-sm text-ds-muted-foreground">No specific areas listed.</p>}
                                </>
                            ) : (
                                <p className="mt-3 text-body-sm text-ds-muted-foreground"><MapPin aria-hidden="true" className="mb-3 size-6 text-ds-primary" />Search, choose a district or tap a map marker to see its listed coverage.</p>
                            )}
                        </div>
                        <div className="mt-6 border-t border-ds-border pt-5">
                            <p className="text-body-sm text-ds-muted-foreground">Select your region and district in the repair request form.</p>
                            <Link to={showRequest ? requestAction.to : '/dashboard'} className={cn(buttonVariants({ variant: 'action' }), 'mt-4 h-auto min-h-11 w-full whitespace-normal text-center')}>
                                {showRequest ? 'Request a repair' : 'Open your dashboard'}<ArrowRight aria-hidden="true" className="shrink-0" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
};

export default ServiceAreas;
