import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, RotateCcw, Wrench } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import { serviceDefinitionKeys } from '../../hooks/serviceDefinitionKeys';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct,
    formatEstimateRange, humanizeSlug,
} from '../../utils/serviceDefinitionCatalog';
import { getProductCategoryIcon } from '../../utils/productCategoryIcons';
import { shouldShowCreateRequestLink, REQUEST_REPAIR_ROUTE } from '../../utils/publicContent';
import CTABand from '../../components/public/CTABand';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { buttonVariants } from '../../components/ui/button-variants';
import { cn } from '../../lib/utils';

// Public Services page (Phase 5A).
//
// CANONICAL CATALOGUE. This page previously rendered the hardcoded
// SERVICE_CATEGORIES marketing list, whose keys (`ac`, `mobile`, `tv`,
// `laptop`, `microwave`, `other`) are NOT the server's productCategorySlug
// values - Phase 3 proved six of the eight do not match. It now reads the live
// catalogue through the existing useServiceDefinitions hook: the same public
// GET /service-definitions and the same existing query key
// (['service-definitions','list']), so there is no new endpoint, no new key and
// no extra fetch beyond the one the request form already warms.
//
// Where Home shows a category-level span, this page lists the actual SERVICES.
// That means every range here is the exact `pricingEstimate` the server stated
// for that row - nothing derived, nothing aggregated, nothing invented. Ranges
// are labelled as estimates, because the binding number is the quote prepared
// after inspection: labour + parts + additional charges, approved by the
// customer before any work starts. This page does not change that.
//
// Degrades honestly: skeletons reserve the layout while loading; an empty or
// unavailable catalogue drops to a truthful state rather than showing invented
// services.
const Services = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const { data, isPending, isPaused, isError } = useServiceDefinitions();
    const queryClient = useQueryClient();

    // Technicians and admins are not offered a customer-only action.
    const showRequestLinks = shouldShowCreateRequestLink({ user, role });

    const definitions = normalizeServiceDefinitions(data);
    const categories = deriveProductCategories(definitions);

    // Three states, kept genuinely distinct. `isLoading` is not enough: it is
    // `isPending && isFetching`, and when the API is unreachable React Query
    // PAUSES the query (fetchStatus 'paused') - so isLoading goes false while
    // the request has never resolved. Branching on it would drop an unreachable
    // catalogue into the empty branch and tell the visitor there are no repair
    // services, which is a claim this page has no basis to make. Verified
    // against a stopped API: status 'pending', fetchStatus 'paused'.
    const loading = isPending && !isPaused;
    const unreachable = isError || isPaused;
    const unavailable = !loading && (unreachable || categories.length === 0);

    // Retry has to actually retry. `refetch()` cannot restart a PAUSED query -
    // React Query will not begin a fetch it believes cannot succeed, so the
    // button would look live and do nothing. Resetting discards the paused
    // retryer and lets this page's observer fetch again; verified by stopping
    // the API, pressing the control, restarting it and pressing it again. The
    // key comes from the existing factory, so no new query key is introduced,
    // and there is no data on screen in this branch for the reset to discard.
    const handleRetry = () => queryClient.resetQueries({ queryKey: serviceDefinitionKeys.list() });

    return (
        <div>
            <section className="px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pt-16">
                <div className="mx-auto max-w-6xl">
                    {/* Deliberately NOT the homepage's "What we repair / Every
                        service, with an honest range." Both pages used to open
                        on that exact string, so following "All services" from
                        the homepage landed on a first screen that read as the
                        one you just left. The homepage spans a whole category;
                        this page lists the individual repairs underneath it,
                        and the heading now says so. */}
                    <p className="ds-label text-ds-primary">Full catalogue</p>
                    <h1 className="mt-4 max-w-[20ch] text-3xl font-extrabold tracking-tight text-ds-foreground sm:text-4xl lg:text-display">
                        The whole list, device by device.
                    </h1>
                    <p className="mt-5 max-w-2xl text-body text-ds-muted-foreground">
                        These are the repairs Sarabo currently handles, straight from the service catalogue.
                        Each range is an estimate — the price you actually pay is the quote your technician
                        prepares after inspecting the device, and you approve it before any work begins.
                    </p>
                </div>
            </section>

            <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
                <div className="mx-auto max-w-6xl">
                    {loading && (
                        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading repair services">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-56 rounded-ds-lg" />
                            ))}
                        </div>
                    )}

                    {!loading && !unavailable && (
                        <div className="flex flex-col gap-6">
                            {categories.map((category) => {
                                const Icon = getProductCategoryIcon(category.slug);
                                const services = getServicesForProduct(definitions, category.slug);
                                const to = showRequestLinks
                                    ? `${REQUEST_REPAIR_ROUTE}?category=${encodeURIComponent(category.slug)}`
                                    : null;

                                return (
                                    <section key={category.slug} className="overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card">
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ds-border bg-ds-muted/50 px-5 py-4 sm:px-6">
                                            <h2 className="flex items-center gap-3 text-subhead text-ds-foreground">
                                                <span className="flex size-10 items-center justify-center rounded-ds border border-ds-border bg-ds-card">
                                                    <Icon aria-hidden="true" className="size-5" />
                                                </span>
                                                {category.label}
                                            </h2>
                                            {to && (
                                                <Link
                                                    to={to}
                                                    className="focus-ring inline-flex items-center gap-1.5 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline"
                                                >
                                                    Request {category.label} repair
                                                    <ArrowRight aria-hidden="true" className="size-4" />
                                                </Link>
                                            )}
                                        </div>

                                        <ul>
                                            {services.map((definition) => {
                                                const range = formatEstimateRange(definition.pricingEstimate);
                                                const row = (
                                                    <>
                                                        <span className="min-w-0">
                                                            <span className="block text-body-sm font-semibold text-ds-foreground">
                                                                {definition.label}
                                                            </span>
                                                            <span className="mt-0.5 block text-micro text-ds-muted-foreground">
                                                                {humanizeSlug(definition.repairCategorySlug)}
                                                            </span>
                                                        </span>
                                                        <span className="flex items-center gap-3 sm:gap-5">
                                                            {range && (
                                                                <span className="text-right">
                                                                    <span className="ds-numeric block text-body-sm font-semibold text-ds-foreground">{range}</span>
                                                                    <span className="block text-micro text-ds-muted-foreground">estimated range</span>
                                                                </span>
                                                            )}
                                                            {to && (
                                                                <span className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-ds-border text-ds-muted-foreground transition-colors group-hover:border-ds-primary/50 group-hover:text-ds-primary sm:flex">
                                                                    <ChevronRight aria-hidden="true" className="size-4" />
                                                                </span>
                                                            )}
                                                        </span>
                                                    </>
                                                );

                                                return (
                                                    <li key={definition.id} className="border-b border-ds-border last:border-b-0">
                                                        {to ? (
                                                            <Link
                                                                to={to}
                                                                className="focus-ring group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ds-muted/50 sm:px-6"
                                                            >
                                                                {row}
                                                            </Link>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">{row}</div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {unavailable && (
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
                                        <Link to={REQUEST_REPAIR_ROUTE} className={buttonVariants({ size: 'sm' })}>
                                            Request a Repair <ArrowRight aria-hidden="true" />
                                        </Link>
                                    )}
                                    {unreachable && (
                                        <button type="button" onClick={handleRetry} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                                            <RotateCcw aria-hidden="true" /> Try again
                                        </button>
                                    )}
                                </div>
                            }
                        />
                    )}
                </div>
            </section>

            <CTABand
                eyebrow="Not sure which service?"
                heading="Describe the problem and we'll work it out."
                description="Pick the closest device category, tell us what is wrong, and the technician confirms the exact service during inspection."
            />
        </div>
    );
};

export default Services;
