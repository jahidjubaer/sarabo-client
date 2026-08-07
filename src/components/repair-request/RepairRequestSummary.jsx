import { formatEstimateRange } from '../../utils/serviceDefinitionCatalog';

// Read-only recap of what the customer just submitted (Phase 6.4 Unit 3A) -
// built entirely from local form values and the already-fetched catalogue
// definition, never from the POST /parcels response (which only contains
// { acknowledged, insertedId } - see src/api/repairRequests.js - no
// trackingId/product/pricing fields are returned to re-display).
const RepairRequestSummary = ({ productCategoryLabel, definition, damageDescription, serviceLocation }) => {
    return (
        <div className="card bg-base-200 p-4 text-sm space-y-1">
            <p><span className="font-semibold">Product:</span> {productCategoryLabel}</p>
            <p><span className="font-semibold">Service:</span> {definition?.label}</p>
            {definition?.pricingEstimate && (
                <p><span className="font-semibold">Estimated price:</span> {formatEstimateRange(definition.pricingEstimate)} (estimate only)</p>
            )}
            <p><span className="font-semibold">Issue:</span> {damageDescription}</p>
            <p><span className="font-semibold">Service location:</span> {serviceLocation?.address}, {serviceLocation?.district}, {serviceLocation?.region}</p>
        </div>
    );
};

export default RepairRequestSummary;
