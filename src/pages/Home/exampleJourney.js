import { SPINE_STAGES } from '../../utils/repairStage';

// An ILLUSTRATIVE spine model for the public homepage.
//
// The homepage has no repair to show. It must not pretend otherwise: no
// invented tracking code, customer, technician, timestamp or status count
// appears anywhere on it, and nothing here is labelled "live".
//
// This builds a model by hand rather than calling getSpineModel(), precisely
// so that no fake persisted status is ever pushed through the real
// status-mapping table. ServiceSpine already accepts a resolved `model` as a
// documented entry point for exactly this case, so no Phase 1 primitive is
// modified or extended.
//
// `flow: 'example'` is deliberately not one of the real FLOW_STATES. That is
// what keeps it honest: getFlowCaption() falls through to its default and
// returns null, so the spine renders the shape of the journey with no
// completion or exception claim attached to it.
export function getExampleJourneyModel(currentStage = 3) {
    const current = SPINE_STAGES[currentStage - 1] || SPINE_STAGES[0];

    return {
        stage: current.stage,
        key: current.key,
        label: current.label,
        state: 'current',
        terminal: false,
        flow: 'example',
        currentLabel: null,
        legacy: false,
        unknown: false,
        stages: SPINE_STAGES.map((stage) => ({
            ...stage,
            state: stage.stage < current.stage
                ? 'done'
                : stage.stage === current.stage ? 'current' : 'upcoming',
        })),
    };
}
