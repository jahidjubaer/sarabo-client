// Pure inspection-form helpers (Phase 6.4 Unit 4). No React, no network - the
// single place the technician form's option lists, client-side validation, and
// request-payload shape are defined, so they can be exercised directly under
// Node. The server (sarabo-server utils/inspection.js) is always the real
// authority and revalidates everything; this only gives fast, friendly
// client-side feedback and builds an explicit, whitelisted payload.

export const SEVERITY_OPTIONS = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'major', label: 'Major' },
    { value: 'critical', label: 'Critical' },
];

export const REPAIRABILITY_OPTIONS = [
    { value: 'repairable', label: 'Repairable' },
    { value: 'repairable_with_parts', label: 'Repairable with parts' },
    { value: 'not_economical', label: 'Not economical to repair' },
    { value: 'not_repairable', label: 'Not repairable' },
];

const SEVERITY_VALUES = SEVERITY_OPTIONS.map((o) => o.value);
const REPAIRABILITY_VALUES = REPAIRABILITY_OPTIONS.map((o) => o.value);

export const DIAGNOSIS_SUMMARY_MIN = 10;
export const DIAGNOSIS_SUMMARY_MAX = 2000;
export const ISSUE_LABEL_MIN = 2;
export const ISSUE_LABEL_MAX = 150;
export const ISSUE_NOTES_MAX = 500;
export const REASON_MIN = 10;
export const REASON_MAX = 1000;
export const INTERNAL_NOTES_MAX = 2000;
export const MIN_DETECTED_ISSUES = 1;
export const MAX_DETECTED_ISSUES = 10;
export const MAX_ESTIMATE_BDT = 500000;

function isBlank(value) {
    return typeof value !== 'string' || value.trim().length === 0;
}

// Parses an optional whole-taka estimate text input. Returns { ok, value }
// where value is a non-negative integer or null. Rejects decimals, negatives,
// non-numeric text, and out-of-range values - never silently coerces.
export function parseEstimate(raw) {
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
        return { ok: true, value: null };
    }
    const str = String(raw).trim();
    if (!/^\d+$/.test(str)) return { ok: false };
    const num = Number(str);
    if (!Number.isInteger(num) || num < 0 || num > MAX_ESTIMATE_BDT) return { ok: false };
    return { ok: true, value: num };
}

// Builds the exact server payload from form values via an explicit
// field-by-field whitelist - never spreads the raw form object, so no
// unexpected/injected key (a MongoDB operator, or an authority field like
// status/version/submittedByEmail/currency/approvedAmount) can ever reach the
// request body. currency is deliberately never sent: the server owns it (BDT).
export function buildInspectionPayload(values) {
    const issues = (Array.isArray(values.detectedIssues) ? values.detectedIssues : []).map((issue) => {
        const entry = { label: (issue.label || '').trim(), severity: issue.severity };
        if (!isBlank(issue.notes)) entry.notes = issue.notes.trim();
        return entry;
    });

    return {
        diagnosis: {
            summary: (values.diagnosisSummary || '').trim(),
            detectedIssues: issues,
        },
        repairability: {
            decision: values.repairabilityDecision,
            reason: (values.repairabilityReason || '').trim(),
        },
        estimate: {
            laborEstimate: parseEstimate(values.laborEstimate).value,
            partsEstimate: parseEstimate(values.partsEstimate).value,
        },
        internalNotes: isBlank(values.internalNotes) ? null : values.internalNotes.trim(),
    };
}

export function severityLabel(value) {
    return (SEVERITY_OPTIONS.find((o) => o.value === value) || {}).label || value;
}

export function repairabilityLabel(value) {
    return (REPAIRABILITY_OPTIONS.find((o) => o.value === value) || {}).label || value;
}
