import { createElement, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, RotateCcw, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import servicePhoto from '../../../assets/card-laptop-computer.jpg';
import { buttonVariants } from '../../../components/ui/button-variants';
import { Skeleton } from '../../../components/ui/skeleton';
import useAuth from '../../../hooks/useAuth';
import { serviceDefinitionKeys } from '../../../hooks/serviceDefinitionKeys';
import { useServiceDefinitions } from '../../../hooks/useServiceDefinitions';
import useRole from '../../../hooks/useRole';
import { cn } from '../../../lib/utils';
import { REQUEST_REPAIR_ROUTE, shouldShowCreateRequestLink } from '../../../utils/publicContent';
import { deriveProductCategories, getServicesForProduct, normalizeServiceDefinitions } from '../../../utils/serviceDefinitionCatalog';
import { getProductCategoryIcon } from '../../../utils/productCategoryIcons';
import { getCategoryPhoto, getPhotoCredits } from '../categoryPhotos';

const CATEGORY_GRID = 'grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6';
const SERVICE_POINTS = ['Describe the fault', 'Review an itemised quote', 'Follow repair progress'];

function CategoryImage({ slug, icon: Icon }) {
    const [failed, setFailed] = useState(false);
    const photo = getCategoryPhoto(slug);
    return (
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-ds-border bg-ds-muted">
            {photo && !failed ? (
                <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async"
                    onError={() => setFailed(true)}
                    className="size-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none" />
            ) : createElement(Icon, { 'aria-hidden': true, className: 'size-14 text-ds-primary', strokeWidth: 1.25 })}
        </div>
    );
}

const ServiceCatalogue = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const { data, isPending, isPaused, isError } = useServiceDefinitions();
    const queryClient = useQueryClient();
    const showRequestLinks = shouldShowCreateRequestLink({ user, role });

    const definitions = normalizeServiceDefinitions(data);
    const categories = deriveProductCategories(definitions);
    // Preserve the existing catalogue query branches and exact-key recovery.
    const loading = isPending && !isPaused;
    const unreachable = isError || isPaused;
    const unavailable = !loading && (unreachable || categories.length === 0);
    const handleRetry = () => queryClient.resetQueries({ queryKey: serviceDefinitionKeys.list() });
    const photoCredits = getPhotoCredits(categories.map((category) => category.slug));

    return (
        <section aria-labelledby="home-services-heading" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-6xl">
                <div className="grid items-center gap-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:gap-14">
                    <div className="overflow-hidden rounded-ds-lg border border-ds-border bg-ds-muted">
                        <img src={servicePhoto} width="1600" height="1099" loading="lazy" decoding="async"
                            alt="A technician examining the components inside an open laptop at a workbench."
                            className="aspect-[4/3] w-full object-cover object-center" />
                    </div>
                    {/* Always mounted, independent of catalogue loading or availability. */}
                    <div data-tour="services" className="min-w-0">
                        <h2 id="home-services-heading" className="max-w-[22ch] text-title text-ds-foreground">A clearer path from fault to fix.</h2>
                        <p className="mt-4 max-w-lg text-body text-ds-muted-foreground">From everyday electronics to home appliances, keep your repair details and next steps in one place.</p>
                        <ul className="mt-5 space-y-3">
                            {SERVICE_POINTS.map((point) => <li key={point} className="flex items-center gap-3 text-body text-ds-foreground">
                                <Check aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                                {point}
                            </li>)}
                        </ul>
                        <Link to="/services" className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-ds text-sm font-semibold text-ds-primary hover:underline">
                            Explore services <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                </div>

                <div className="mb-6 mt-12 border-t border-ds-border pt-8 sm:mt-14">
                    <h3 className="text-heading text-ds-foreground">What needs repairing?</h3>
                    <p className="mt-2 text-body-sm text-ds-muted-foreground">Explore the device categories in our current service catalogue.</p>
                </div>

                {loading && (
                    <div className={CATEGORY_GRID} aria-busy="true" aria-label="Loading repair services">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card">
                                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                                <div className="space-y-3 p-4">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="mt-5 h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                        <span role="status" className="sr-only">Loading repair categories…</span>
                    </div>
                )}

                {!loading && !unavailable && (
                    <>
                        <ul className={CATEGORY_GRID}>
                            {categories.map((category) => {
                                const example = getServicesForProduct(definitions, category.slug)[0];
                                // Use the existing category-prefill route and role-aware destination.
                                const to = showRequestLinks
                                    ? `${REQUEST_REPAIR_ROUTE}?category=${encodeURIComponent(category.slug)}`
                                    : '/services';
                                return (
                                    <li key={category.slug} className="min-w-0">
                                        <Link to={to}
                                            aria-label={`${showRequestLinks ? 'Request a repair' : 'Browse services'} — ${category.label}`}
                                            className="focus-ring group flex h-full flex-col overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card transition-[border-color,box-shadow,transform] duration-200 hover:border-ds-primary/50 hover:shadow-sm focus-visible:border-ds-primary motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none">
                                            <CategoryImage slug={category.slug} icon={getProductCategoryIcon(category.slug)} />
                                            <div className="flex flex-1 flex-col p-4">
                                                <h4 className="break-words text-heading text-ds-foreground">{category.label}</h4>
                                                {example && <p className="mt-2 line-clamp-2 text-body-sm text-ds-muted-foreground">{example.label}</p>}
                                                <span className="mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-semibold text-ds-primary">
                                                    {showRequestLinks ? 'Request repair' : 'Browse services'}
                                                    <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        {photoCredits.length > 0 && <p className="mt-5 break-words text-micro text-ds-muted-foreground">Category photographs: {photoCredits.join(' · ')}.</p>}
                    </>
                )}

                {unavailable && (
                    <div className="flex min-h-72 flex-col items-start justify-center rounded-ds-lg border border-ds-border bg-ds-card p-6 sm:p-8">
                        <p role="status" className="max-w-lg text-body-sm text-ds-muted-foreground">
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
