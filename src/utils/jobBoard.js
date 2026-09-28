import { humanizeSlug } from './serviceDefinitionCatalog';

// Open jobs board helpers.
export function jobTitle(job) {
    const named = [job.product.brand, job.product.model].filter(Boolean).join(' ');
    return named || humanizeSlug(job.product.categorySlug);
}

export const DECLINE_REASONS = [
    { value: 'price', label: 'The estimate is too high' },
    { value: 'inspection_fee', label: 'The inspection fee is too high' },
    { value: 'other', label: 'Something else' },
];
