import { Wrench, CircleCheck } from 'lucide-react';
import CategoryImage from '../public/CategoryImage';
import EstimateCard from './EstimateCard';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

const TILE_BASE = 'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ds-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ds-background relative flex min-w-0 cursor-pointer flex-col rounded-ds-lg border border-ds-border bg-ds-card p-4 transition-colors hover:border-ds-input has-[:checked]:border-ds-primary has-[:checked]:ring-2 has-[:checked]:ring-ds-primary';

// Presentational, controlled-by-parent catalogue selector. `register`/`errors` come
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
                    headingLevel={3}
                />
            );
        }
        if (!productCategories || productCategories.length === 0) {
            return (
                <EmptyState
                    icon={Wrench}
                    title="No repair services available"
                    description="There are no repair services to request right now. Please check back later."
                    headingLevel={3}
                />
            );
        }
        return (
            <fieldset>
                <legend className="mb-3 text-body-sm font-semibold text-ds-foreground">
                    Device category <span aria-hidden="true" className="text-ds-destructive">*</span>
                    <span className="sr-only"> (required)</span>
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {productCategories.map((category) => (
                        <label
                            key={category.slug}
                            className="group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card transition-colors hover:border-ds-input has-[:checked]:border-ds-primary has-[:checked]:ring-2 has-[:checked]:ring-ds-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ds-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ds-background"
                        >
                            <input
                                type="radio"
                                value={category.slug}
                                {...register('productCategorySlug', { required: 'Please select a product category.' })}
                                className="peer sr-only"
                                aria-invalid={errors.productCategorySlug ? 'true' : 'false'}
                                aria-required="true"
                                aria-describedby={errors.productCategorySlug ? 'productCategorySlug-error' : undefined}
                            />
                            <CategoryImage slug={category.slug} className="aspect-[4/3] w-full" iconClassName="size-8" />
                            <span className="flex items-center justify-between gap-2 p-3">
                                <span className="break-words text-body-sm font-semibold text-ds-foreground">{category.label}</span>
                                <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-ds-primary opacity-0 peer-checked:opacity-100 group-has-[:checked]:opacity-100" />
                            </span>
                        </label>
                    ))}
                </div>
                {errors.productCategorySlug && (
                    <p id="productCategorySlug-error" role="alert" className="mt-2 text-body-sm font-medium text-ds-destructive">{errors.productCategorySlug.message}</p>
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
        <fieldset>
            <legend className="mb-3 text-body-sm font-semibold text-ds-foreground">
                Repair service <span aria-hidden="true" className="text-ds-destructive">*</span>
                <span className="sr-only"> (required)</span>
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {servicesForSelectedProduct.map((def) => (
                    <label key={def.id} className={cn(TILE_BASE, 'min-h-24 pr-9')}>
                        <input
                            type="radio"
                            value={def.id}
                            {...register('serviceDefinitionId', { required: 'Please select a repair service.' })}
                            className="peer sr-only"
                            aria-invalid={errors.serviceDefinitionId ? 'true' : 'false'}
                            aria-required="true"
                            aria-describedby={errors.serviceDefinitionId ? 'serviceDefinitionId-error' : undefined}
                        />
                        <CircleCheck aria-hidden="true" className="pointer-events-none absolute right-2 top-2 size-4 text-ds-primary opacity-0 peer-checked:opacity-100" />
                        <span className="break-words text-body-sm font-semibold text-ds-foreground">{def.label}</span>
                        <span className="mt-1 text-micro text-ds-muted-foreground">{humanizeSlug(def.repairCategorySlug)}</span>
                    </label>
                ))}
            </div>
            {errors.serviceDefinitionId && (
                <p id="serviceDefinitionId-error" role="alert" className="mt-2 text-body-sm font-medium text-ds-destructive">{errors.serviceDefinitionId.message}</p>
            )}
            {selectedDefinition && <EstimateCard definition={selectedDefinition} className="mt-4" />}
        </fieldset>
    );
};

export default ServiceDefinitionSelector;
