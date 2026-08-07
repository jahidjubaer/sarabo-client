// Client-side visibility/UX validation only (Phase 6.4 Unit 3A) - mirrors
// sarabo-server's utils/repairRequestV2.js bounds exactly (same min/max
// lengths) so a rejection here matches what the server would say anyway,
// but the server remains the sole authority; every one of these rules is
// re-validated server-side on submit.
export const DAMAGE_DESCRIPTION_MIN_LENGTH = 10;
export const DAMAGE_DESCRIPTION_MAX_LENGTH = 1000;
export const BRAND_MODEL_MAX_LENGTH = 100;
export const LOCATION_FIELD_MAX_LENGTH = 150;

function isBlank(value) {
    return typeof value !== 'string' || value.trim().length === 0;
}

function exceedsLength(value, max) {
    return typeof value === 'string' && value.trim().length > max;
}

// `definitions` is the already-fetched, already-normalized catalogue (see
// serviceDefinitionCatalog.js) - used only to confirm the selected
// serviceDefinitionId still exists and still belongs to the selected
// product category, never to re-derive or override either value.
export function validateRepairRequestV2Form(values, definitions) {
    const errors = {};

    if (isBlank(values.productCategorySlug)) {
        errors.productCategorySlug = 'Please select a product category.';
    }

    if (isBlank(values.serviceDefinitionId)) {
        errors.serviceDefinitionId = 'Please select a repair service.';
    } else {
        const selected = definitions.find((def) => def.id === values.serviceDefinitionId);
        if (!selected) {
            errors.serviceDefinitionId = 'Please select a repair service.';
        } else if (!isBlank(values.productCategorySlug) && selected.productCategorySlug !== values.productCategorySlug) {
            errors.serviceDefinitionId = 'Please re-select a repair service for this product category.';
        }
    }

    if (!isBlank(values.productBrand) && exceedsLength(values.productBrand, BRAND_MODEL_MAX_LENGTH)) {
        errors.productBrand = `Brand must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`;
    }
    if (!isBlank(values.productModel) && exceedsLength(values.productModel, BRAND_MODEL_MAX_LENGTH)) {
        errors.productModel = `Model must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`;
    }

    const description = typeof values.damageDescription === 'string' ? values.damageDescription.trim() : '';
    if (description.length < DAMAGE_DESCRIPTION_MIN_LENGTH || description.length > DAMAGE_DESCRIPTION_MAX_LENGTH) {
        errors.damageDescription = `Please describe the issue in ${DAMAGE_DESCRIPTION_MIN_LENGTH}-${DAMAGE_DESCRIPTION_MAX_LENGTH} characters.`;
    }

    const location = values.serviceLocation || {};
    if (isBlank(location.region)) {
        errors['serviceLocation.region'] = 'Please select a region.';
    }
    if (isBlank(location.district)) {
        errors['serviceLocation.district'] = 'Please select a district.';
    }
    if (isBlank(location.address)) {
        errors['serviceLocation.address'] = 'Please enter a service address.';
    } else if (exceedsLength(location.address, LOCATION_FIELD_MAX_LENGTH)) {
        errors['serviceLocation.address'] = `Service address must be ${LOCATION_FIELD_MAX_LENGTH} characters or fewer.`;
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

// Explicit field-by-field whitelist - never spreads the raw form object, so
// no unexpected/injected key (e.g. a MongoDB operator smuggled in via a
// crafted form field name) can ever reach the request body. Matches
// sarabo-server's exact createRepairRequestV2 contract: product/
// serviceDefinitionId/damage/serviceLocation only - no senderEmail, role, or
// pricing field of any kind.
export function buildRepairRequestV2Payload(values) {
    const product = { categorySlug: values.productCategorySlug.trim() };
    if (!isBlank(values.productBrand)) product.brand = values.productBrand.trim();
    if (!isBlank(values.productModel)) product.model = values.productModel.trim();
    if (!isBlank(values.productSerialNumber)) product.serialNumber = values.productSerialNumber.trim();

    return {
        schemaVersion: 2,
        product,
        serviceDefinitionId: values.serviceDefinitionId,
        // Damage images are never submitted at creation time - the optional
        // photo step (PostCreationDamageStep.jsx) reuses the existing Unit 3
        // upload workflow strictly after the request exists.
        damage: { description: values.damageDescription.trim(), images: [] },
        serviceLocation: {
            region: values.serviceLocation.region.trim(),
            district: values.serviceLocation.district.trim(),
            address: values.serviceLocation.address.trim(),
        },
    };
}
