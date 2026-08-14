// Pure presentation + privacy helpers for the public repair-tracking page
// (Phase 7.9). The public endpoint (GET /public/trackings/:code) is the
// sanitized, unauthenticated contract; this module builds the view model by
// an explicit whitelist so that even if the server response were to include
// extra fields, the public UI can only ever render the four public-safe ones.
// Statuses are always mapped through the single canonical label helper - no
// raw status string is ever surfaced.

import { getRepairStatusLabel } from './repairStatus';
import { getSpineModel, getFlowCaption, getSpineCounter } from './repairStage';

// Matches the server's tracking-code format guard - used only for immediate
// client-side feedback on an obviously invalid submission, never to decide
// whether the request exists.
export const TRACKING_CODE_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function isValidTrackingCode(code) {
    return TRACKING_CODE_PATTERN.test((typeof code === 'string' ? code : '').trim());
}

// Derives the public service-spine presentation from the raw stored status.
//
// The raw status string is consumed HERE and never leaves this module. What
// comes back is presentation only: stage names, stage states and a caption -
// exactly the same information the page already showed through statusLabel,
// expressed as a progression instead of a single word.
//
// getSpineModel() is the single source of truth for status -> stage (Phase 1),
// so no mapping is duplicated and an unrecognised status keeps its existing
// safe fallback: a complete model with nothing claimed, flagged `unknown`.
//
// A bare status string is passed rather than a request object on purpose. The
// public tracking response is not a repair request, and this module must not
// start reading further fields off it - schemaVersion included - just to
// refine a presentation detail.
//
// The returned object is built field by field, never spread, so the raw status
// cannot leak through here either.
function buildPublicSpine(currentStatus) {
    const model = getSpineModel(currentStatus);
    const counter = getSpineCounter(model);

    return {
        stage: model.stage,
        key: model.key,
        label: model.label,
        state: model.state,
        currentLabel: model.currentLabel,
        flow: model.flow,
        caption: getFlowCaption(model),
        terminal: model.terminal,
        unknown: model.unknown,
        counter: counter ? { current: counter.current, total: counter.total } : null,
        stages: model.stages.map((stage) => ({
            stage: stage.stage,
            key: stage.key,
            label: stage.label,
            state: stage.state,
        })),
    };
}

// Explicit whitelist - NEVER spreads the raw response. Only trackingCode,
// a status label, updatedAt, a timeline of { timestamp, statusLabel } and the
// DERIVED spine presentation are exposed. Any customer name/email/address/
// technician-id/quote/payment/inspection-note field the server might ever
// return is structurally dropped here.
//
// `currentStatus` is read to derive the label and the spine, and is
// deliberately NOT part of the returned object - the page never sees a raw
// persisted status string.
export function buildPublicTrackingModel(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const timelineSrc = Array.isArray(raw.timeline) ? raw.timeline : [];
    return {
        trackingCode: typeof raw.trackingCode === 'string' ? raw.trackingCode : '',
        statusLabel: getRepairStatusLabel(raw.currentStatus),
        updatedAt: raw.updatedAt || null,
        spine: buildPublicSpine(raw.currentStatus),
        timeline: timelineSrc.map((entry) => ({
            timestamp: entry?.timestamp || null,
            statusLabel: getRepairStatusLabel(entry?.status),
        })),
    };
}

// Maps a tracking error to safe, human-facing copy (mirrors the page's prior
// status-based mapping). Never surfaces a raw Axios/server/Mongo message, and
// does not leak existence distinctions beyond the not-found default.
export function getTrackingErrorCopy(error) {
    const status = error?.response?.status;
    if (status === 429) {
        return { title: 'Too many requests', message: 'Please wait a moment before trying again.' };
    }
    if (!status || status >= 500) {
        return { title: 'We could not load your repair tracking', message: 'This looks temporary — please try again in a moment.' };
    }
    return { title: 'Tracking code not found', message: 'We could not find that tracking code. Please check it and try again.' };
}
