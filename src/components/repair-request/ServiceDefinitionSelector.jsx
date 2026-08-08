import { Smartphone, Laptop, Tablet, Tv, Refrigerator, AirVent, WashingMachine, Watch, Headphones, Wrench, Boxes, CircleCheck } from 'lucide-react';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../ui/skeleton';
import EstimateCard from './EstimateCard';
import { cn } from '../../lib/utils';

// Decorative-only icon lookup (Phase 7.7). This is NOT a taxonomy: it maps a
// server-provided product-category slug to a Lucide glyph purely for visual
// affordance, and falls back to a generic icon for any slug it does not
// recognize - so a new server category always renders safely without this
// client ever inventing or gating a category of its own.
const CATEGORY_ICONS = {
    'smartphone': Smartphone,
    'mobile-phone': Smartphone,
    'phone': Smartphone,
    'laptop': Laptop,
    'computer': Laptop,
    'tablet': Tablet,
    'television': Tv,
    'tv': Tv,
    'refrigerator': Refrigerator,
    'fridge': Refrigerator,
    'air-conditioner': AirVent,
    'ac': AirVent,
    'washing-machine': WashingMachine,
    'smartwatch': Watch,
    'watch': Watch,
    'headphones': Headphones,
    'earphones': Headphones,
};

function categoryIcon(slug) {
    return CATEGORY_ICONS[slug] || Boxes;
}

const TILE_BASE = 'focus-within:ring-2 focus-within:ring-ds-ring focus-within:ring-offset-1 focus-within:ring-offset-ds-background relative flex cursor-pointer flex-col rounded-ds-lg border border-ds-border bg-ds-card p-4 transition-colors hover:border-ds-primary/50 has-[:checked]:border-ds-primary has-[:checked]:bg-ds-primary/5';

// Presentational, controlled-by-parent catalogue selector (Phase 6.4 Unit 3A,
// redesigned to ds-* radio-card tiles in Phase 7.7). `register`/`errors` come
// from the parent's react-hook-form instance (no Controller, no new form
// library). Every value in `productCategories`/`servicesForSelectedProduct` is
// server-derived (serviceDefinitionCatalog.js) - this component never invents a
// category, service, or price. Selection is driven by the native radio
// `:checked` state via has-[] variants (a ring + the input's own checked
// semantics, never colour alone), keeping the whole selector keyboard-operable.
//
// `part` composes the catalogue into the guided flow's two sections:
//   'category' -> product-category tiles (owns catalogue loading/error/empty)
//   'service'  -> repair-service tiles + estimate for the chosen category
const ServiceDefinitionSelector = ({
    part,
    register,
    errors,
    isLoading,
    isError,
    onRetry,
    productCategories,
    servicesForSelectedProduct,
    selectedProductCategorySlug,
    selectedDefinition,
}) => {
    if (part === 'category') {
        if (isLoading) {
            return (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Loading product categories">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-ds-lg" />)}
                </div>
            );
        }
        if (isError) {
            return (
                <ErrorState
                    title="Service catalogue unavailable"
                    description="We could not load the list of repair services. Please try again."
                    onRetry={onRetry}
                />
            );
        }
        if (!productCategories || productCategories.length === 0) {
            return (
                <EmptyState
                    icon={Wrench}
                    title="No repair services available"
                    description="There are no repair services to request right now. Please check back later."
                />
            );
        }
        return (
            <fieldset>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {productCategories.map((category) => {
                        const Icon = categoryIcon(category.slug);
                        return (
                            <label key={category.slug} className={cn(TILE_BASE, 'items-start')}>
                                <input
                                    type="radio"
                                    value={category.slug}
                                    {...register('productCategorySlug', { required: 'Please select a product category.' })}
                                    className="peer sr-only"
                                    aria-invalid={errors.productCategorySlug ? 'true' : 'false'}
                                />
                                <CircleCheck aria-hidden="true" className="pointer-events-none absolute right-2 top-2 size-4 text-ds-primary opacity-0 peer-checked:opacity-100" />
                                <Icon aria-hidden="true" className="mb-2 size-6 text-ds-primary" />
                                <span className="text-sm font-medium text-ds-foreground">{category.label}</span>
                            </label>
                        );
                    })}
                </div>
                {errors.productCategorySlug && (
                    <p role="alert" className="mt-2 text-xs font-medium text-ds-destructive">{errors.productCategorySlug.message}</p>
                )}
            </fieldset>
        );
    }

    // part === 'service'
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading repair services">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-ds-lg" />)}
            </div>
        );
    }
    if (isError) {
        return <p className="text-sm text-ds-muted-foreground">Repair services could not be loaded.</p>;
    }
    if (!selectedProductCategorySlug) {
        return (
            <p className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-sm text-ds-muted-foreground">
                Select a product category first.
            </p>
        );
    }
    if (servicesForSelectedProduct.length === 0) {
        return (
            <p className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-sm text-ds-muted-foreground">
                No repair services are available for this product category.
            </p>
        );
    }
    return (
        <div className="space-y-4">
            <fieldset>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {servicesForSelectedProduct.map((def) => (
                        <label key={def.id} className={cn(TILE_BASE, 'pr-8')}>
                            <input
                                type="radio"
                                value={def.id}
                                {...register('serviceDefinitionId', { required: 'Please select a repair service.' })}
                                className="peer sr-only"
                                aria-invalid={errors.serviceDefinitionId ? 'true' : 'false'}
                            />
                            <CircleCheck aria-hidden="true" className="pointer-events-none absolute right-2 top-2 size-4 text-ds-primary opacity-0 peer-checked:opacity-100" />
                            <span className="text-sm font-medium text-ds-foreground">{def.label}</span>
                            <span className="mt-0.5 text-xs text-ds-muted-foreground">{humanizeSlug(def.repairCategorySlug)}</span>
                        </label>
                    ))}
                </div>
                {errors.serviceDefinitionId && (
                    <p role="alert" className="mt-2 text-xs font-medium text-ds-destructive">{errors.serviceDefinitionId.message}</p>
                )}
            </fieldset>

            {selectedDefinition && <EstimateCard definition={selectedDefinition} />}
        </div>
    );
};

export default ServiceDefinitionSelector;
