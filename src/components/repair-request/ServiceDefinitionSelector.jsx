import { FaSyncAlt } from 'react-icons/fa';
import { formatEstimateRange } from '../../utils/serviceDefinitionCatalog';

// Presentational, controlled-by-parent catalogue selector (Phase 6.4 Unit
// 3A) - `register`/`errors` come from the parent's react-hook-form
// instance, mirroring the plain-register pattern already established in
// src/pages/Dashboard/CreateRequest/CreateRequest.jsx (no Controller
// wrapper, no new form-library usage). Every value in `productCategories`/
// `servicesForSelectedProduct` is server-derived (see
// serviceDefinitionCatalog.js) - this component never invents a category or
// service of its own.
const ServiceDefinitionSelector = ({
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
    if (isLoading) {
        return (
            <div className="space-y-2" aria-busy="true" aria-label="Loading service catalogue">
                <div className="h-10 rounded bg-base-200 animate-pulse" />
                <div className="h-10 rounded bg-base-200 animate-pulse" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span>The service catalogue could not be loaded.</span>
                <button type="button" onClick={onRetry} className="btn btn-ghost btn-xs">
                    <FaSyncAlt aria-hidden="true" /> Retry
                </button>
            </div>
        );
    }

    if (productCategories.length === 0) {
        return <p className="text-sm opacity-70">No repair services are available right now. Please check back later.</p>;
    }

    return (
        <>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">Product Category</legend>
                <select
                    {...register('productCategorySlug', { required: 'Please select a product category.' })}
                    defaultValue=""
                    className={`select ${errors.productCategorySlug ? 'select-error' : ''}`}
                    aria-invalid={errors.productCategorySlug ? 'true' : 'false'}
                    aria-describedby={errors.productCategorySlug ? 'productCategorySlug-error' : undefined}
                >
                    <option value="" disabled>Pick a product category</option>
                    {productCategories.map((category) => (
                        <option key={category.slug} value={category.slug}>{category.label}</option>
                    ))}
                </select>
                {errors.productCategorySlug && (
                    <p id="productCategorySlug-error" role="alert" className="text-red-500 text-sm mt-1">{errors.productCategorySlug.message}</p>
                )}
            </fieldset>

            <fieldset className="fieldset">
                <legend className="fieldset-legend">Repair Service</legend>
                {!selectedProductCategorySlug ? (
                    <p className="text-sm opacity-70">Select a product category first.</p>
                ) : servicesForSelectedProduct.length === 0 ? (
                    <p className="text-sm opacity-70">No repair services are available for this product category.</p>
                ) : (
                    <select
                        {...register('serviceDefinitionId', { required: 'Please select a repair service.' })}
                        defaultValue=""
                        className={`select ${errors.serviceDefinitionId ? 'select-error' : ''}`}
                        aria-invalid={errors.serviceDefinitionId ? 'true' : 'false'}
                        aria-describedby={errors.serviceDefinitionId ? 'serviceDefinitionId-error' : undefined}
                    >
                        <option value="" disabled>Pick a repair service</option>
                        {servicesForSelectedProduct.map((def) => (
                            <option key={def.id} value={def.id}>{def.label}</option>
                        ))}
                    </select>
                )}
                {errors.serviceDefinitionId && (
                    <p id="serviceDefinitionId-error" role="alert" className="text-red-500 text-sm mt-1">{errors.serviceDefinitionId.message}</p>
                )}
            </fieldset>

            {selectedDefinition && (
                <div className="card bg-base-200 p-4 text-sm" aria-live="polite">
                    <p><span className="font-semibold">Estimated price:</span> {formatEstimateRange(selectedDefinition.pricingEstimate)}</p>
                    {selectedDefinition.pricingEstimate.inspectionFee > 0 && (
                        <p className="opacity-70">Inspection fee may apply if a technician visit is required.</p>
                    )}
                    <p className="opacity-70 mt-1">This is an estimate only, not a final invoice - the actual cost may change after inspection or quote, and no payment is requested now.</p>
                </div>
            )}
        </>
    );
};

export default ServiceDefinitionSelector;
