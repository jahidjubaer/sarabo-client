// Pure helpers for the admin service catalogue editor (quick-wins phase).
// The server is the authority (models/ServiceDefinition.js validates every
// value); these only shape the form and give instant feedback.

export const EXPERTISE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
export const MAX_IMAGE_COUNT = 3;
export const MAX_DURATION_MINUTES = 4320;
export const MAX_BASE_PRICE = 100000;
export const MAX_INSPECTION_FEE = 1000;
export const LABEL_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export function pairKey(productCategorySlug, repairCategorySlug) {
    return `${productCategorySlug}/${repairCategorySlug}`;
}

// A stored service (admin list shape) -> form values (strings for inputs).
export function toFormValues(definition) {
    if (!definition) {
        return {
            pair: '', label: '', description: '', baseMin: '', baseMax: '', inspectionFee: '0',
            requiredExpertiseLevel: 'intermediate', estimatedDurationMinutes: '60', inspectionRequired: true,
            imageMin: '0', imageMax: '3', imageRecommended: true, isActive: true,
        };
    }
    return {
        pair: pairKey(definition.productCategorySlug, definition.repairCategorySlug),
        label: definition.label ?? '',
        description: definition.description ?? '',
        baseMin: String(definition.pricingRule?.baseMin ?? ''),
        baseMax: String(definition.pricingRule?.baseMax ?? ''),
        inspectionFee: String(definition.pricingRule?.inspectionFee ?? '0'),
        requiredExpertiseLevel: definition.requiredExpertiseLevel ?? 'intermediate',
        estimatedDurationMinutes: String(definition.estimatedDurationMinutes ?? ''),
        inspectionRequired: definition.inspectionRequired === true,
        imageMin: String(definition.imageRequirements?.min ?? 0),
        imageMax: String(definition.imageRequirements?.max ?? 3),
        imageRecommended: definition.imageRequirements?.recommended === true,
        isActive: definition.isActive === true,
    };
}

const toInt = (value) => Number(String(value).trim());

// Form values -> the service fields the API takes.
export function toServiceFields(values) {
    return {
        label: values.label.trim(),
        description: values.description.trim(),
        isActive: values.isActive === true,
        requiredExpertiseLevel: values.requiredExpertiseLevel,
        estimatedDurationMinutes: toInt(values.estimatedDurationMinutes),
        inspectionRequired: values.inspectionRequired === true,
        imageRequirements: { min: toInt(values.imageMin), max: toInt(values.imageMax), recommended: values.imageRecommended === true },
        pricingRule: { baseMin: toInt(values.baseMin), baseMax: toInt(values.baseMax), inspectionFee: toInt(values.inspectionFee) },
    };
}

// Only what actually changed, in the shape PATCH expects. Returns
// { changes, priceChanged, switchingOff }.
export function diffServiceChanges(definition, values) {
    const next = toServiceFields(values);
    const changes = {};
    for (const field of ['label', 'description', 'isActive', 'requiredExpertiseLevel', 'estimatedDurationMinutes', 'inspectionRequired']) {
        if (next[field] !== definition[field]) changes[field] = next[field];
    }
    const images = definition.imageRequirements || {};
    if (next.imageRequirements.min !== images.min || next.imageRequirements.max !== images.max || next.imageRequirements.recommended !== images.recommended) {
        changes.imageRequirements = next.imageRequirements;
    }
    const pricing = {};
    for (const field of ['baseMin', 'baseMax', 'inspectionFee']) {
        if (next.pricingRule[field] !== definition.pricingRule?.[field]) pricing[field] = next.pricingRule[field];
    }
    if (Object.keys(pricing).length) changes.pricingRule = pricing;
    return {
        changes,
        priceChanged: Object.keys(pricing).length > 0,
        switchingOff: definition.isActive === true && next.isActive === false,
    };
}

// react-hook-form rules for whole-taka amounts and whole numbers.
export function wholeNumberRule({ min, max, label }) {
    return {
        validate: (value) => {
            const text = String(value ?? '').trim();
            if (!/^\d+$/.test(text)) return `${label} must be a whole number.`;
            const n = Number(text);
            if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
            return true;
        },
    };
}
