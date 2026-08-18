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
import { getCategoryPhoto, getPhotoCredits } from '../categoryPhotos';
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
    const photoCredits = getPhotoCredits(categories.map((category) => category.slug));
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
                        {/* Said once, here, rather than repeated on every card:
                            the rule is the same for all of them. */}
                        <p className="mt-3 max-w-xl text-body-sm text-ds-muted-foreground">
                            Ranges come straight from the service catalogue. The price you actually pay is the
                            quote, confirmed after inspection and approved by you first — it depends on the device
                            condition, the repair needed, and parts.
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
                            const photo = getCategoryPhoto(category.slug);
                            return (
                                <li key={category.slug}>
                                    {/* One link per card, named for the category, so
                                        eight cards never announce eight identical
                                        "Request repair" targets. h-full + flex-col +
                                        an mt-auto footer keeps the price and the
                                        action on one baseline across a row, however
                                        many example lines a category has. */}
                                    <Link
                                        to={to}
                                        aria-label={showRequestLinks
                                            ? `Request a repair — ${category.label}`
                                            : `Browse services — ${category.label}`}
                                        className="focus-ring group flex h-full flex-col overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card transition-colors hover:border-ds-primary/50"
                                    >
                                        {photo && (
                                            // The photograph is shown as taken - no wash,
                                            // no tint, no text on top of it. Nothing has to
                                            // stay legible over an unpredictable part of an
                                            // image, so nothing has to be faded out to make
                                            // it legible.
                                            <div className="aspect-video shrink-0 overflow-hidden border-b border-ds-border bg-ds-muted">
                                                <img
                                                    src={photo.src}
                                                    alt={photo.alt}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-1 flex-col p-5">
                                            {/* The device name is the largest thing in
                                                the card. This grid answers "do you fix my
                                                TV?", so the answer has to lead - and the
                                                icon sits above the title rather than
                                                beside it, because at heading size it
                                                crowded the word instead of labelling it. */}
                                            <Icon aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                                            <h3 className="mt-2.5 text-heading text-ds-foreground">
                                                <span className="block min-w-0 truncate">{category.label}</span>
                                            </h3>

                                            {/* The binding number is the quote. A
                                                catalogue range is shown only when the
                                                server actually stated one, and never as
                                                a "from" price - which is also why the
                                                label sits ABOVE the figure. Read in
                                                order it says "estimated range: X",
                                                never a bare number that could be taken
                                                for the price. */}
                                            {range ? (
                                                <>
                                                    <p className="ds-label mt-3 text-ds-muted-foreground">Estimated range</p>
                                                    <p className="ds-numeric mt-1 text-body-sm font-semibold text-ds-foreground">{range}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="ds-label mt-3 text-ds-muted-foreground">No catalogue range yet</p>
                                                    <p className="mt-1 text-body-sm font-semibold text-ds-foreground">Quote after inspection</p>
                                                </>
                                            )}

                                            {examples.length > 0 && (
                                                // Real catalogue service labels, run
                                                // together rather than set as a bulleted
                                                // table - the card is a summary, not a
                                                // service list.
                                                <p className="mt-4 flex-1 border-t border-ds-border pt-4 text-body-sm text-ds-muted-foreground">
                                                    {examples.map((service) => service.label).join(' · ')}
                                                </p>
                                            )}

                                            <span className="mt-4 flex items-center gap-1.5 text-body-sm font-semibold text-ds-primary">
                                                {showRequestLinks ? 'Request repair' : 'Browse services'}
                                                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* CC BY and CC BY-SA both require credit wherever the work is
                    shown, and only the photographs actually on screen are
                    credited. */}
                {!loading && !unavailable && photoCredits.length > 0 && (
                    <p className="mt-6 text-micro text-ds-muted-foreground/70">
                        Category photographs: {photoCredits.join(' · ')}.
                    </p>
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
