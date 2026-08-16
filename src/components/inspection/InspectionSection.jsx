import { useQueryClient } from '@tanstack/react-query';
import { useInspection } from '../../hooks/useInspection';
import { inspectionKeys } from '../../hooks/inspectionKeys';
import { Button } from '../ui/button';
import InspectionForm from './InspectionForm';
import InspectionSummary from './InspectionSummary';

// Orchestrates the inspection area inside the repair workspace (Phase 6.4
// Unit 4). Server truth decides which of form / summary / hint is shown; the
// server always re-authorizes on submit. Redesigned to ds-* copy in 7.6A.
const InspectionSection = ({ requestId, canInspect, isAssignedTechnicianView }) => {
    const queryClient = useQueryClient();
    const { data: inspection, isLoading, isPaused, isError } = useInspection(requestId);
    const hasUsableInspection = inspection !== undefined && inspection !== null;
    const isInitialLoading = isLoading && !hasUsableInspection;
    const isUnavailableBeforeData = isPaused && !hasUsableInspection;
    const isReadErrorBeforeData = isError && !hasUsableInspection;
    const retryInspection = () => queryClient.resetQueries({ queryKey: inspectionKeys.request(requestId) });

    if (isInitialLoading) {
        return <p className="text-sm text-ds-muted-foreground" aria-busy="true">Loading inspection…</p>;
    }
    if (isUnavailableBeforeData || isReadErrorBeforeData) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-ds-muted-foreground">Inspection details are unavailable right now.</p>
                <Button variant="ghost" size="sm" onClick={retryInspection}>Try again</Button>
            </div>
        );
    }
    if (!inspection) {
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
