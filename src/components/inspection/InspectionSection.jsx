import { useInspection } from '../../hooks/useInspection';
import InspectionForm from './InspectionForm';
import InspectionSummary from './InspectionSummary';

// Orchestrates the inspection area inside the repair workspace (Phase 6.4
// Unit 4). Server truth decides which of form / summary / hint is shown; the
// server always re-authorizes on submit. Redesigned to ds-* copy in 7.6A.
const InspectionSection = ({ requestId, canInspect, isAssignedTechnicianView }) => {
    const { data: inspection, isLoading, isError } = useInspection(requestId);

    if (isLoading) {
        return <p className="text-sm text-ds-muted-foreground" aria-busy="true">Loading inspection…</p>;
    }
    if (isError || !inspection) {
        return <p className="text-sm text-ds-muted-foreground">Inspection details are unavailable right now.</p>;
    }
    if (inspection.status === 'submitted') {
        return <InspectionSummary inspection={inspection} />;
    }
    if (canInspect) {
        return <InspectionForm requestId={requestId} />;
    }
    if (isAssignedTechnicianView) {
        return <p className="text-sm text-ds-muted-foreground">You can submit an inspection once you have marked the device as received.</p>;
    }
    return <p className="text-sm text-ds-muted-foreground">This request has not been inspected yet.</p>;
};

export default InspectionSection;
