import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RotateCcw, Wrench } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { useServiceDefinitions } from '../../../hooks/useServiceDefinitions';
import { serviceDefinitionKeys } from '../../../hooks/serviceDefinitionKeys';
import { normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct } from '../../../utils/serviceDefinitionCatalog';
import { getProductCategoryIcon } from '../../../utils/productCategoryIcons';
import { shouldShowCreateRequestLink, REQUEST_REPAIR_ROUTE } from '../../../utils/publicContent';
import { getCategoryEstimateRanges } from '../categoryPricing';
import { Skeleton } from '../../../components/ui/skeleton';
import { buttonVariants } from '../../../components/ui/button-variants';
import { cn } from '../../../lib/utils';

// What Sarabo repairs, as a grid of service cards: category, the real repairs
// listed under it, what the price actually depends on, and one action.
//
// CANONICAL SLUGS ONLY. Categories come from the live catalogue via the
// existing useServiceDefinitions hook - the same public GET /service-definitions
// and the same existing query key (['service-definitions','list']) the request
// form already warms. No new endpoint, no new key, no extra fetch.
//
// This is the fix for a real trap: the old marketing list used aliases like
// `ac` and `mobile`, while the server's canonical productCategorySlug values
// are `air-conditioner` and `smartphone`. Six of those eight aliases are not
// canonical, so deep-linking them would have silently prefilled nothing.
// Deriving from the catalogue means the slug in the link is always the slug
// the form expects.
//
// Ranges are real: every service definition carries a server-stated
// pricingEstimate, and getCategoryEstimateRanges spans a category's own
// services. They are labelled as estimates because the binding number is the
// quote, after inspection.
const MAX_ROWS = 8;
// A few real examples per card. More than this turns a service card into a
// table and pushes the price block below the fold on a phone. Categories that
// list fewer simply show fewer - nothing is padded out.
const EXAMPLES_PER_CARD = 3;

const ServiceCatalogue = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const { data, isPending, isPaused, isError } = useServiceDefinitions();
    const queryClient = useQueryClient();

    // Technicians and admins are not offered a customer-only action.
    const showRequestLinks = shouldShowCreateRequestLink({ user, role });

    const definitions = normalizeServiceDefinitions(data);
    const categories = deriveProductCategories(definitions).slice(0, MAX_ROWS);
    const ranges = getCategoryEstimateRanges(definitions);
    const loading = isPending && !isPaused;
    const unreachable = isError || isPaused;
    const unavailable = !loading && (unreachable || categories.length === 0);
    const handleRetry = () => queryClient.resetQueries({ queryKey: serviceDefinitionKeys.list() });

    return (
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="ds-label text-ds-primary">What we repair</p>
                        <h2 className="mt-3 text-title text-ds-foreground">Every service, with an honest range.</h2>
                        <p className="mt-3 max-w-xl text-body-sm text-ds-muted-foreground">
                            Ranges come straight from the service catalogue. The price you actually pay is the
                            quote, confirmed after inspection — and you approve it first.
                        </p>
                    </div>
                    {/* Phase 13A: min-h-6 only. Measured at 89x21, this standalone
                        link sat under WCAG 2.2 SC 2.5.8's 24px minimum target and
                        is not an inline-in-a-sentence exception. The text box grows
                        by 3px and nothing reflows. */}
                    <Link to="/services" className="focus-ring inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline">
                        All services <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>

                {loading && (
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading repair services">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={index} className="h-64 rounded-ds-lg" />
                        ))}
                    </div>
                )}

                {!loading && !unavailable && (
                    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {categories.map((category) => {
                            const Icon = getProductCategoryIcon(category.slug);
                            const range = ranges[category.slug];
                            const examples = getServicesForProduct(definitions, category.slug).slice(0, EXAMPLES_PER_CARD);
                            const to = showRequestLinks
                                ? `${REQUEST_REPAIR_ROUTE}?category=${encodeURIComponent(category.slug)}`
                                : '/services';
                            return (
                                <li key={category.slug}>
                                    {/* h-full + flex-col + an mt-auto footer keeps
                                        the price block and the action on one
                                        baseline across a row, however many
                                        example lines a category happens to have. */}
                                    <article className="flex h-full flex-col rounded-ds-lg border border-ds-border bg-ds-card p-5 transition-colors hover:border-ds-primary/40">
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-ds border border-ds-border bg-ds-muted/40 text-ds-primary">
                                                <Icon aria-hidden="true" className="size-5" />
                                            </span>
                                            <h3 className="min-w-0 pt-1.5 text-subhead text-ds-foreground">{category.label}</h3>
                                        </div>

                                        {examples.length > 0 && (
                                            <>
                                                <p className="ds-label mt-5 text-ds-muted-foreground">Common repairs</p>
                                                {/* Real catalogue service labels, not
                                                    marketing examples. */}
                                                <ul className="mt-2 flex flex-col gap-1.5">
                                                    {examples.map((service) => (
                                                        <li key={service.id} className="flex items-start gap-2 text-body-sm text-ds-muted-foreground">
                                                            <Wrench aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ds-primary/70" />
                                                            <span className="min-w-0">{service.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}

                                        <div className="mt-auto pt-5">
                                            {/* The binding number is the quote. A
                                                catalogue range is shown only when the
                                                server actually stated one, and never
                                                as a "from" price. */}
                                            <div className="rounded-ds border border-ds-border bg-ds-muted/30 p-3">
                                                {range ? (
                                                    <>
                                                        <p className="ds-numeric text-body-sm font-semibold text-ds-foreground">{range}</p>
                                                        <p className="ds-label mt-0.5 text-ds-muted-foreground">Estimated range</p>
                                                    </>
                                                ) : (
                                                    <p className="text-body-sm font-semibold text-ds-foreground">Quote after inspection</p>
                                                )}
                                                <p className="mt-2 text-micro text-ds-muted-foreground">
                                                    The final cost is the quote you approve after inspection — it depends on the
                                                    device condition, the repair needed, and parts.
                                                </p>
                                            </div>

                                            <Link
                                                to={to}
                                                aria-label={showRequestLinks
                                                    ? `Request a repair — ${category.label}`
                                                    : `Browse services — ${category.label}`}
                                                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}
                                            >
                                                {showRequestLinks ? 'Request Repair' : 'Browse services'}
                                                <ArrowRight aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {unavailable && (
                    <div className="mt-10 rounded-ds-lg border border-ds-border bg-ds-card p-6">
                        <p className="text-body-sm text-ds-muted-foreground">
                            {unreachable
                                ? 'The service list could not be loaded right now. You can still describe your device in the request form.'
                                : 'There are no repair services to show right now. You can still describe your device in the request form.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
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
                            {!showRequestLinks && (
                                <Link to="/services" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                    <Wrench aria-hidden="true" /> Browse services
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ServiceCatalogue;
