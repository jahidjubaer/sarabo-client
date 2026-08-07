import Swal from 'sweetalert2';
import { useRepair } from '../../hooks/useRepair';
import { useStartRepair } from '../../hooks/useRepairMutations';
import RepairProgressTimeline from './RepairProgressTimeline';
import RepairProgressForm from './RepairProgressForm';
import RepairCompletionForm from './RepairCompletionForm';
import RepairSummary from './RepairSummary';

const START_ERROR_COPY = {
    REPAIR_NOT_PAYABLE_COMPLETE: 'The repair cannot start until payment is completed.',
    REPAIR_ALREADY_STARTED: 'The repair has already been started.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can start this repair.',
    REQUEST_NOT_ASSIGNED_TO_TECHNICIAN: 'This request is no longer assigned to you.',
};
function startErrorMessage(error) {
    return START_ERROR_COPY[error?.response?.data?.code] || 'Could not start the repair. Please try again.';
}

// Orchestrates the repair area inside RequestDetails (Phase 6.4 Unit 7).
// Rendered only for v2 requests. Decides, from server truth, whether to show the
// technician's controls (start / progress / completion) or a read-only view.
// The server always re-authorizes and re-validates every action.
//
//  - completed                          -> read-only summary (everyone)
//  - in_progress + assigned technician  -> timeline + progress form + completion form
//  - in_progress + customer/admin       -> timeline (read-only)
//  - not_started + assigned technician + payment_completed -> Start Repair
//  - otherwise                          -> neutral note
const RepairSection = ({ requestId, canManage, deliveryStatus }) => {
    const { data: repair, isLoading, isError } = useRepair(requestId);
    const startMutation = useStartRepair(requestId);

    if (isLoading) {
        return <p className="opacity-70 text-sm" aria-busy="true">Loading repair status…</p>;
    }
    if (isError || !repair) {
        return <p className="opacity-70 text-sm">Repair details are unavailable right now.</p>;
    }

    if (repair.status === 'completed') {
        return <RepairSummary repair={repair} />;
    }

    if (repair.status === 'in_progress') {
        return (
            <div className="space-y-5">
                <div>
                    <h4 className="font-semibold mb-2">Progress</h4>
                    <RepairProgressTimeline updates={repair.progressUpdates} />
                </div>
                {canManage && (
                    <>
                        <RepairProgressForm requestId={requestId} />
                        <div className="border-t border-base-300 pt-4">
                            <RepairCompletionForm requestId={requestId} />
                        </div>
                    </>
                )}
            </div>
        );
    }

    // not_started
    if (canManage && deliveryStatus === 'payment_completed') {
        const onStart = () => {
            if (startMutation.isPending) return;
            startMutation.mutate(undefined, {
                onError: (err) => Swal.fire({ icon: 'error', title: 'Could not start repair', text: startErrorMessage(err) }),
            });
        };
        return (
            <div className="space-y-3">
                <p className="opacity-70 text-sm">Payment is complete. You can begin the repair.</p>
                <button type="button" onClick={onStart} disabled={startMutation.isPending} className="btn btn-primary">
                    {startMutation.isPending ? 'Starting…' : 'Start Repair'}
                </button>
            </div>
        );
    }

    return <p className="opacity-70 text-sm">The repair has not started yet.</p>;
};

export default RepairSection;
