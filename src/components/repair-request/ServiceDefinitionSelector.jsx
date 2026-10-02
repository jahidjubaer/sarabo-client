import { Wrench } from 'lucide-react';
import EstimateCard from './EstimateCard';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { Select } from '../ui/select';
import { FormField } from '../common/FormField';

// Presentational, controlled-by-parent catalogue selector. `register`/`errors` come
// from the parent's react-hook-form instance (no Controller, no new form
// library). Every value in `productCategories`/`servicesForSelectedProduct` is
// server-derived (serviceDefinitionCatalog.js) - this component never invents a
// category, service, or price. Both choices are native dropdowns (ui/select):
// the platform picker on phones, full keyboard support, and they stay short
// now that a device has up to 8 repair services.
//
// `part` composes the catalogue into the guided flow's two sections:
//   'category' -> device-category dropdown (owns catalogue loading/error/empty)
//   'service'  -> repair-service dropdown + estimate for the chosen category
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
                <Skeleton className="h-16 rounded-ds" aria-busy="true" aria-label="Loading device categories" />
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
            <FormField id="productCategorySlug" label="Device category" required error={errors.productCategorySlug?.message}>
                <Select
                    id="productCategorySlug"
                    {...register('productCategorySlug', { required: 'Please select a device category.' })}
                >
                    <option value="">Choose your device</option>
                    {productCategories.map((category) => (
                        <option key={category.slug} value={category.slug}>{category.label}</option>
                    ))}
                </Select>
            </FormField>
        );
    }

    // part === 'service'
    if (isLoading) {
        return (
            <Skeleton className="h-16 rounded-ds" aria-busy="true" aria-label="Loading repair services" />
        );
    }
    if (isError) {
        return <p className="text-sm text-ds-muted-foreground">Repair services could not be loaded.</p>;
    }
    if (!selectedProductCategorySlug) {
        return (
            <p className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-sm text-ds-muted-foreground">
                Choose your device first.
            </p>
        );
    }
    if (servicesForSelectedProduct.length === 0) {
        return (
            <p className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-sm text-ds-muted-foreground">
                No repair services are available for this device yet.
            </p>
        );
    }
    return (
        <div>
            <FormField id="serviceDefinitionId" label="Repair service" required error={errors.serviceDefinitionId?.message}>
                <Select
                    id="serviceDefinitionId"
                    {...register('serviceDefinitionId', { required: 'Please select a repair service.' })}
                >
                    <option value="">Choose the repair you need</option>
                    {servicesForSelectedProduct.map((def) => (
                        <option key={def.id} value={def.id}>{def.label}</option>
                    ))}
                </Select>
            </FormField>
            {selectedDefinition && <EstimateCard definition={selectedDefinition} className="mt-4" />}
        </div>
    );
};

export default ServiceDefinitionSelector;
