// "Needs attention" helpers (overdue-alerts phase). Pure; the lists come from
// GET /admin/attention.
import { humanizeSlug } from './serviceDefinitionCatalog';

export const ATTENTION_FLAGS = {
    overdue: { label: 'Pickup time passed', tone: 'attention' },
    unmatched: { label: 'No local technician', tone: 'danger' },
};

// Sets of request ids, for badging rows that come from other lists.
export function attentionIdSets(data) {
    return {
        overdue: new Set((data?.overdueWaiting ?? []).map((r) => r.id)),
        unmatched: new Set((data?.unmatchable ?? []).map((r) => r.id)),
    };
}

export function flagsFor(id, sets) {
    if (!sets) return [];
    return ['overdue', 'unmatched'].filter((key) => sets[key].has(id));
}

// "Samsung A52", or the device type when there is no brand/model.
export function attentionDeviceLabel(entry) {
    const named = [entry?.brand, entry?.model].filter(Boolean).join(' ');
    if (named) return named;
    return entry?.productCategorySlug ? humanizeSlug(entry.productCategorySlug) : 'Device';
}
