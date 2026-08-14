// The service spine: the four-stage, user-facing view of a repair.
//
//     Request  ->  Inspect  ->  Approve  ->  Repaired
//
// PRESENTATION ONLY. This module maps the persisted `deliveryStatus` onto a
// coarse public progression for the redesigned surfaces (hero, tracking page,
// form stepper, dashboards). It changes no business rule, renames no status,
// and calls no API. The detailed nine-step workspace timeline in
// utils/workspacePresentation.js is a different, finer-grained view and stays
// exactly as it is - the two are deliberately separate audiences, not
// duplicates: this one is for people watching a repair, that one is for people
// working it.
//
// Components consume the returned model only. No component should ever compare
// a raw status string, which is why the status table lives here alone.
//
// Every status the client references is mapped explicitly (audited against
// sarabo-server's utils/repairRequestStatus.js and every client reference).
// Anything unrecognised degrades to a safe, well-formed model rather than
// throwing or leaking the raw value into the UI.

// ---------------------------------------------------------------------------
// The four stages. Order is the contract; `key` is what components branch on.
// ---------------------------------------------------------------------------
export const SPINE_STAGES = [
    { stage: 1, key: 'request', label: 'Request' },
    { stage: 2, key: 'inspect', label: 'Inspect' },
    { stage: 3, key: 'approve', label: 'Approve' },
    { stage: 4, key: 'repaired', label: 'Repaired' },
];

export const SPINE_STAGE_COUNT = SPINE_STAGES.length;

// Stage states.
//   done      the stage is behind us
//   current   where the repair is right now
//   upcoming  not reached yet
//   blocked   reached, then stopped here (a declined quote)
//   cancelled the request was cancelled
//   skipped   this stage does not exist for this request (legacy records only)
// `skipped` extends the base set. It exists because legacy (schemaVersion 1)
// requests never had an inspection/quote workflow at all, and showing their
// "Approve" stage as permanently upcoming would claim something untrue about a
// finished repair.
export const STAGE_STATES = ['done', 'current', 'upcoming', 'blocked', 'cancelled', 'skipped'];

// Flow-level state, describing the repair as a whole rather than one stage.
export const FLOW_STATES = ['active', 'complete', 'blocked', 'cancelled', 'unknown'];

// ---------------------------------------------------------------------------
// Status table. Every persisted deliveryStatus the client references maps here.
//
// `stage`      which of the four stages the repair currently sits in
// `stageState` the state of THAT stage (earlier stages are implicitly done,
//              later ones implicitly upcoming)
// `flow`       the whole-repair state
// `terminal`   no further progress is expected from this status
// `now`        what is happening RIGHT NOW, in the customer's words
//
// `now` exists because the canonical stage label alone can mislead. A repair
// at `repair_in_progress` sits in stage 4, whose label is "Repaired" - and
// "Repaired / Now" reads as finished when it is not. The stage metadata stays
// canonical (key `repaired`, label "Repaired"); this contextual line is what
// the spine actually shows against the current stage, in the mobile summary
// and in the screen-reader announcement. Wording follows the copy already used
// in config/statusPresentation.js, so nothing new is invented.
//
// Deliberately absent: `in_delivery`, which is a TECHNICIAN workStatus
// (available | in_delivery), never a repair status - see
// utils/adminPresentation.js. Mapping it here would have been a category error.
//
// Also absent: `assignment_rejected`. It does not exist. When a technician
// rejects an offered assignment the server moves the request back to
// `pending-pickup` so it can be reassigned (sarabo-server
// utils/repairRequestStatus.js documents assignment_pending -> pending-pickup
// as the reject transition). A rejected assignment is therefore shown, truly,
// as stage 1 awaiting a technician - active and non-terminal.
// ---------------------------------------------------------------------------
const STATUS_MAP = {
    // --- Stage 1: the request exists, no technician is confirmed yet --------
    'pending-pickup': { stage: 1, stageState: 'current', flow: 'active', terminal: false, now: 'Awaiting technician' },
    // A technician has been offered the job but has not accepted, so the
    // request is not yet in anyone's hands.
    'assignment_pending': { stage: 1, stageState: 'current', flow: 'active', terminal: false, now: 'Confirming technician' },

    // --- Stage 2: a technician has it, or is on the way to get it ----------
    'driver_assigned': { stage: 2, stageState: 'current', flow: 'active', terminal: false, now: 'Technician assigned' },
    'rider_arriving': { stage: 2, stageState: 'current', flow: 'active', terminal: false, now: 'Technician on the way' },
    'parcel_picked_up': { stage: 2, stageState: 'current', flow: 'active', terminal: false, now: 'Device collected' },
    // Inspection is finished but no quote exists yet, so there is still
    // nothing for the customer to approve - the repair remains in "Inspect"
    // rather than advancing to a stage that implies an action they cannot take.
    'inspection_completed': { stage: 2, stageState: 'current', flow: 'active', terminal: false, now: 'Inspection complete' },

    // --- Stage 3: the money question, and the customer's decision ----------
    'quote_submitted': { stage: 3, stageState: 'current', flow: 'active', terminal: false, now: 'Quote ready to review' },
    'quote_approved': { stage: 3, stageState: 'current', flow: 'active', terminal: false, now: 'Awaiting payment' },
    'payment_completed': { stage: 3, stageState: 'current', flow: 'active', terminal: false, now: 'Payment received' },
    // Declined. Earlier stages genuinely happened; this stage stopped, and
    // "Repaired" must not be implied.
    'quote_rejected': { stage: 3, stageState: 'blocked', flow: 'blocked', terminal: true, now: 'Quote declined' },

    // --- Stage 4: the repair itself ----------------------------------------
    'repair_in_progress': { stage: 4, stageState: 'current', flow: 'active', terminal: false, now: 'Repair in progress' },
    'repair_completed': { stage: 4, stageState: 'done', flow: 'complete', terminal: true },
    // Legacy (schemaVersion 1) completion, and the terminal state of the
    // courier-era generic transition path.
    'parcel_delivered': { stage: 4, stageState: 'done', flow: 'complete', terminal: true },

    // --- Cancelled ---------------------------------------------------------
    // Handled as a whole-flow exception below: the status alone does not say
    // how far the repair had got, so no stage is claimed as completed.
    'cancelled': { stage: 1, stageState: 'cancelled', flow: 'cancelled', terminal: true },
};

const DEFAULT_STATUS = 'pending-pickup';

function readStatus(request) {
    if (typeof request === 'string') return request;
    const status = request?.deliveryStatus;
    return typeof status === 'string' && status.length > 0 ? status : DEFAULT_STATUS;
}

// Legacy records predate the v2 inspection/quote/repair workflow, so their
// "Approve" stage never existed. Everything else in the app already derives
// this the same way (see utils/workspacePresentation.js#isLegacyRequest).
function isLegacyRequest(request) {
    if (typeof request === 'string') return false;
    return request?.schemaVersion !== 2;
}

// ---------------------------------------------------------------------------
// The model.
//
// Returns, for the CURRENT position:
//   { stage, key, label, state, terminal }
// plus the whole progression and a couple of flags:
//   stages   [{ stage, key, label, state }] x4, always four, always in order
//   flow     'active' | 'complete' | 'blocked' | 'cancelled' | 'unknown'
//   legacy   true for schemaVersion 1 records, whose stage 3 is `skipped`
//   unknown  true when the stored status was not recognised
//
// Accepts a request object, a bare status string, or null/undefined/garbage.
// It never throws and never returns a partial model.
// ---------------------------------------------------------------------------
export function getSpineModel(request) {
    const status = readStatus(request);
    const entry = STATUS_MAP[status];
    const legacy = isLegacyRequest(request);

    // Unrecognised stored value: render the spine at rest with nothing
    // claimed. The raw string is never surfaced.
    if (!entry) {
        return {
            stage: 1,
            key: SPINE_STAGES[0].key,
            label: SPINE_STAGES[0].label,
            state: 'upcoming',
            terminal: false,
            flow: 'unknown',
            currentLabel: null,
            legacy,
            unknown: true,
            stages: SPINE_STAGES.map((s) => ({ ...s, state: 'upcoming' })),
        };
    }

    // Cancelled says nothing reliable about how far the repair had progressed,
    // so no stage is marked done - claiming otherwise would invent history.
    if (entry.flow === 'cancelled') {
        return {
            stage: entry.stage,
            key: SPINE_STAGES[0].key,
            label: SPINE_STAGES[0].label,
            state: 'cancelled',
            terminal: true,
            flow: 'cancelled',
            currentLabel: null,
            legacy,
            unknown: false,
            stages: SPINE_STAGES.map((s) => ({ ...s, state: 'cancelled' })),
        };
    }

    const stages = SPINE_STAGES.map((s) => {
        // Legacy requests never had an approval stage.
        if (legacy && s.stage === 3) return { ...s, state: 'skipped' };
        if (s.stage < entry.stage) return { ...s, state: 'done' };
        if (s.stage === entry.stage) return { ...s, state: entry.stageState };
        return { ...s, state: 'upcoming' };
    });

    const currentStage = SPINE_STAGES[entry.stage - 1];

    return {
        stage: entry.stage,
        key: currentStage.key,
        label: currentStage.label,
        state: entry.stageState,
        terminal: entry.terminal,
        flow: entry.flow,
        // Contextual "what is happening now" copy for the current/blocked
        // stage. Null once a repair is finished - a completed spine needs no
        // running commentary, and its caption already says "Repair completed".
        currentLabel: entry.now || null,
        legacy,
        unknown: false,
        stages,
    };
}

// ---------------------------------------------------------------------------
// Post-repair handover.
//
// Deliberately NOT a fifth stage. The spine ends at "Repaired" because that is
// what Sarabo does; whether the customer has physically taken the device back
// is a separate fact, recorded separately, and shown as context beside the
// spine rather than inside it.
//
// Reads the same field the existing confirmation UI reads
// (components/repair/ReceiptConfirmationSection.jsx):
//   request.customerReceiptConfirmation = { status: 'pending'|'confirmed', confirmedAt }
// Receipt confirmation exists only for v2 requests at `repair_completed`;
// legacy `parcel_delivered` records have no confirmation step, so this returns
// null for them rather than inventing a pending action.
//
// Returns null when handover is not yet a meaningful question.
// ---------------------------------------------------------------------------
export function getHandoverState(request) {
    if (typeof request === 'string' || !request) return null;
    if (request.deliveryStatus !== 'repair_completed') return null;

    const confirmation = request.customerReceiptConfirmation;
    const confirmed = confirmation?.status === 'confirmed';

    return {
        key: confirmed ? 'received' : 'awaiting',
        label: confirmed ? 'Device received' : 'Awaiting customer confirmation',
        confirmed,
        confirmedAt: confirmed ? (confirmation?.confirmedAt || null) : null,
    };
}

// Convenience for callers that only need a stage's name.
export function getSpineStageLabel(key) {
    return SPINE_STAGES.find((s) => s.key === key)?.label || '';
}

// "Stage 3 of 4" - the counter shown in mono beside a spine. Returns null for
// states where a position would be misleading (cancelled, unknown).
export function getSpineCounter(model) {
    if (!model || model.unknown || model.flow === 'cancelled') return null;
    return { current: model.stage, total: SPINE_STAGE_COUNT };
}

// Short caption for a flow that is not simply progressing. Kept here beside
// the model so components never branch on a status - or invent wording - of
// their own. Returns null while a repair is running normally, where the stage
// counter already says everything.
export function getFlowCaption(model) {
    if (!model) return null;
    switch (model.flow) {
        case 'complete':
            return 'Repair completed';
        case 'blocked':
            return `Stopped at ${model.label}`;
        case 'cancelled':
            return 'Request cancelled';
        case 'unknown':
            return 'Status unavailable';
        default:
            return null;
    }
}
