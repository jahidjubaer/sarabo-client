import { useInspection } from '../../hooks/useInspection';
import InspectionForm from './InspectionForm';
import InspectionSummary from './InspectionSummary';

// Orchestrates the inspection area inside RequestDetails (Phase 6.4 Unit 4).
// Rendered only for v2 requests. Decides, from server truth, whether to show
// the technician form, the read-only summary, or a neutral placeholder - the
// server always re-authorizes and re-validates on submit, so this is UX only.
//
//  - submitted            -> read-only summary (everyone authorized to read)
//  - not started + eligible technician -> submission form
//  - not started + assigned technician, wrong stage -> pickup hint
//  - not started + customer/admin -> "not inspected yet" note
const InspectionSection = ({ requestId, canInspect, isAssignedTechnicianView }) => {
    const { data: inspection, isLoading, isError } = useInspection(requestId);

    if (isLoading) {
        return <p className="opacity-70 text-sm" aria-busy="true">Loading inspection…</p>;
    }

    // A confirmed error here (e.g. an unexpected 404/403) is non-critical to the
    // rest of the page - never surface a raw error, just omit the section.
    if (isError || !inspection) {
        return <p className="opacity-70 text-sm">Inspection details are unavailable right now.</p>;
    }

    if (inspection.status === 'submitted') {
        return <InspectionSummary inspection={inspection} />;
    }

    if (canInspect) {
        return <InspectionForm requestId={requestId} />;
    }

    if (isAssignedTechnicianView) {
        return <p className="opacity-70 text-sm">You can submit an inspection once you have marked the device as picked up (Start Repair).</p>;
    }

    return <p className="opacity-70 text-sm">This request has not been inspected yet.</p>;
};

export default InspectionSection;
