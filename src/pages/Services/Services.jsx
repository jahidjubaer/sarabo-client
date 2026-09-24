import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RotateCcw, Wrench } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import { serviceDefinitionKeys } from '../../hooks/serviceDefinitionKeys';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct, formatEstimateRange, getCategoryStartingPrice,
} from '../../utils/serviceDefinitionCatalog';
import { getPhotoCredits } from '../../config/categoryPhotos';
import { SERVICE_GROUPS, getServiceGroupKey } from '../../config/serviceGroups';
import { shouldShowCreateRequestLink, getCategoryRequestRoute, REQUEST_REPAIR_ROUTE } from '../../utils/publicContent';
import CategoryImage from '../../components/public/CategoryImage';
import CTABand from '../../components/public/CTABand';
import Reveal from '../../components/public/Reveal';
import SectionHeader from '../../components/public/SectionHeader';
import { Accordion } from '../../components/ui/accordion';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { buttonVariants } from '../../components/ui/button-variants';

// One service entry point: the photo says what it is, the title names it, one
// short line and a starting price, and the whole card is the action.
// Visitors and customers land in a request with the device already chosen;
// staff are taken to the price guide instead.
function ServiceCard({ category, definitions, showRequestLinks, index }) {
    const services = getServicesForProduct(definitions, category.slug);
    const from = getCategoryStartingPrice(definitions, category.slug);
    const count = `${services.length} repair${services.length === 1 ? '' : 's'} listed`;
    const to = showRequestLinks ? getCategoryRequestRoute(category.slug) : '#price-guide';

    return (
        <Reveal as="li" delay={index * 0.05}>
            <Link
                to={to}
                className="focus-ring group flex h-full flex-col overflow-hidden rounded-ds-xl border border-ds-border bg-ds-card transition-[box-shadow,border-color,transform] duration-300 hover:border-ds-primary/40 hover:shadow-xl motion-safe:hover:-translate-y-1"
            >
                <div className="relative">
                    <CategoryImage slug={category.slug} className="aspect-[4/3] w-full" />
                    {from && (
                        <span className="absolute left-2 top-2 rounded-full bg-ds-card/95 px-2.5 py-1 text-micro font-bold sm:left-3 sm:top-3 sm:px-3 text-ds-foreground shadow-sm backdrop-blur">
                            from <span className="ds-numeric">{from}</span>
                        </span>
                    )}
                </div>
                <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                    <h3 className="text-subhead text-ds-foreground">{category.label}</h3>
                    <p className="mt-1 text-body-sm text-ds-muted-foreground">{count}</p>
                    <span className="mt-auto flex items-center justify-between gap-2 pt-4 text-body-sm font-bold text-ds-primary sm:pt-5">
                        {showRequestLinks ? 'Request repair' : 'See prices'}
                        <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-ds-accent min-[380px]:flex transition-colors group-hover:bg-ds-primary group-hover:text-ds-primary-foreground">
                            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
                        </span>
                    </span>
                </div>
            </Link>
        </Reveal>
    );
}

// Public Services page (Phase 2 refinement).
//
// Visual entry points first, detail second: each device is a clickable card
// grouped under the same two gateways the homepage uses, and every estimated
// range lives in the collapsible price guide below. All ranges are the exact
// pricingEstimate the server stated for each service, labelled as estimates -
// the binding price is the quote prepared after inspection.
//
// Degrades honestly: skeletons while loading; an unreachable or empty
// catalogue drops to a truthful state instead of invented services.
const Services = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const { data, isPending, isPaused, isError } = useServiceDefinitions();
    const queryClient = useQueryClient();

    const showRequestLinks = shouldShowCreateRequestLink({ user, role });
    const definitions = normalizeServiceDefinitions(data);
    const categories = deriveProductCategories(definitions);

    // A paused query (API unreachable) is neither loading nor empty.
    // resetQueries restarts a paused query where refetch() cannot.
    const loading = isPending && !isPaused;
    const unreachable = isError || isPaused;
    const unavailable = !loading && (unreachable || categories.length === 0);
    const handleRetry = () => queryClient.resetQueries({ queryKey: serviceDefinitionKeys.list() });
    const photoCredits = getPhotoCredits(categories.map((category) => category.slug));
    const ready = !loading && !unavailable;

    // Homepage gateways link to /services#devices or #appliances, but those
    // sections only exist once the catalogue has loaded, after the router's
    // own hash scroll has already run. Scroll once, when they appear.
    const { hash } = useLocation();
    const scrolledFor = useRef(null);
    useEffect(() => {
        if (!ready || !hash || scrolledFor.current === hash) return;
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (!target) return;
        scrolledFor.current = hash;
        target.scrollIntoView({ block: 'start' });
    }, [ready, hash]);

    const groups = SERVICE_GROUPS
        .map((group) => ({ ...group, categories: categories.filter((category) => getServiceGroupKey(category.slug) === group.key) }))
        .filter((group) => group.categories.length > 0);

    const priceItems = categories.map((category) => ({
        key: category.slug,
        question: category.label,
        answer: (
            <ul className="divide-y divide-ds-border rounded-ds-lg border border-ds-border bg-ds-card">
                {getServicesForProduct(definitions, category.slug).map((definition) => (
                    <li key={definition.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <span className="text-body-sm font-semibold text-ds-foreground">{definition.label}</span>
                        <span className="ds-numeric text-body-sm text-ds-muted-foreground">
                            <span className="sr-only">Estimated range </span>{formatEstimateRange(definition.pricingEstimate)}
                        </span>
                    </li>
                ))}
            </ul>
        ),
    }));

    return (
        <div>
            <header className="px-4 pb-4 pt-12 sm:px-6 lg:px-8 lg:pt-20">
                <div className="mx-auto max-w-6xl">
                    <SectionHeader
                        as="h1"
                        id="page-title"
                        eyebrow="Services"
                        title="Find the right repair"
                        description="Pick your device to start a request. Your technician confirms the exact price in an itemised quote after inspection."
                    />
                </div>
            </header>

            {loading && (
                <div className="px-4 py-12 sm:px-6 lg:px-8" aria-busy="true">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-[4/5] rounded-ds-xl" />)}
                    </div>
                    <span role="status" className="sr-only">Loading repair services…</span>
                </div>
            )}

            {!loading && !unavailable && (
                <>
                    {groups.map((group) => (
                        <section key={group.key} id={group.key} aria-labelledby={`${group.key}-heading`} className="scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-6xl">
                                <Reveal>
                                    <div className="flex items-center gap-3">
                                        <span className="h-6 w-1 rounded-full bg-ds-action" aria-hidden="true" />
                                        <h2 id={`${group.key}-heading`} className="text-heading text-ds-foreground">{group.title}</h2>
                                    </div>
                                </Reveal>
                                <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                                    {group.categories.map((category, index) => (
                                        <ServiceCard key={category.slug} category={category} definitions={definitions} showRequestLinks={showRequestLinks} index={index} />
                                    ))}
                                </ul>
                            </div>
                        </section>
                    ))}

                    <section id="price-guide" aria-labelledby="price-guide-heading" className="scroll-mt-16 bg-ds-canvas px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
                        <div className="mx-auto max-w-4xl">
                            <Reveal>
                                <SectionHeader
                                    id="price-guide-heading"
                                    align="center"
                                    eyebrow="Price guide"
                                    title="Estimated prices"
                                    description="Starting ranges for every repair we list. Your final price is the quote you approve."
                                />
                            </Reveal>
                            <Reveal delay={0.08} className="mt-10">
                                <Accordion items={priceItems} />
                            </Reveal>
                            {photoCredits.length > 0 && <p className="mt-6 text-center text-micro text-ds-muted-foreground">Photo credits: {photoCredits.join(' · ')}.</p>}
                        </div>
                    </section>
                </>
            )}

            {unavailable && (
                <div className="px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <EmptyState
                            icon={Wrench}
                            title={unreachable ? 'Services could not be loaded' : 'No repair services listed yet'}
                            description={
                                unreachable
                                    ? 'This looks temporary. You can still describe your device in the request form.'
                                    : 'There are no repair services to show right now. You can still submit a request describing your device.'
                            }
                            action={
                                <div className="flex flex-wrap justify-center gap-2">
                                    {showRequestLinks && (
                                        <Link to={REQUEST_REPAIR_ROUTE} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                                            Request a repair <ArrowRight aria-hidden="true" />
                                        </Link>
                                    )}
                                    {unreachable && (
                                        <button type="button" onClick={handleRetry} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                            <RotateCcw aria-hidden="true" /> Try again
                                        </button>
                                    )}
                                </div>
                            }
                        />
                    </div>
                </div>
            )}

            <div className={unavailable || loading ? '' : 'pt-20 lg:pt-28'}>
                <CTABand
                    eyebrow="Not sure?"
                    heading="Describe it, we will work it out"
                    description="Pick the closest device and tell us what is wrong. The technician confirms the exact repair during inspection."
                />
            </div>
        </div>
    );
};

export default Services;
