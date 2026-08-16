import { useQueryClient } from '@tanstack/react-query';
import { CircleCheckBig } from 'lucide-react';
import { useRepair } from '../../hooks/useRepair';
import { useStartRepair } from '../../hooks/useRepairMutations';
import { repairKeys } from '../../hooks/repairKeys';
import { notify } from '../../lib/notify';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
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

// Orchestrates the repair area inside the workspace (Phase 6.4 Unit 7),
// redesigned to ds-* in 7.6A. Server truth decides technician controls vs
// read-only; the server re-authorizes every action. Feedback via Toastify.
const RepairSection = ({ requestId, canManage, deliveryStatus }) => {
    const queryClient = useQueryClient();
    const { data: repair, isLoading, isPaused, isError } = useRepair(requestId);
    const startMutation = useStartRepair(requestId);
    const hasUsableRepair = repair !== undefined && repair !== null;
    const isInitialLoading = isLoading && !hasUsableRepair;
    const isUnavailableBeforeData = isPaused && !hasUsableRepair;
    const isReadErrorBeforeData = isError && !hasUsableRepair;
    const retryRepair = () => queryClient.resetQueries({ queryKey: repairKeys.request(requestId) });

    if (isInitialLoading) {
        return <p className="text-sm text-ds-muted-foreground" aria-busy="true">Loading repair status…</p>;
    }
    if (isUnavailableBeforeData || isReadErrorBeforeData) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-ds-muted-foreground">Repair details are unavailable right now.</p>
                <Button variant="ghost" size="sm" onClick={retryRepair}>Try again</Button>
            </div>
        );
    }
    if (!repair) {
        return <p className="text-sm text-ds-muted-foreground">Repair details are unavailable right now.</p>;
    }

    if (repair.status === 'completed') {
        return <RepairSummary repair={repair} />;
    }

    if (repair.status === 'in_progress') {
        return (
            <div className="space-y-5">
                <div>
                    <h4 className="mb-2 text-sm font-semibold text-ds-foreground">Progress</h4>
                    <RepairProgressTimeline updates={repair.progressUpdates} />
                </div>
                {canManage && (
                    <>
                        <RepairProgressForm requestId={requestId} />
                        <Separator />
                        <RepairCompletionForm requestId={requestId} />
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
                onSuccess: () => notify.success('Repair started'),
                onError: (err) => notify.error(startErrorMessage(err)),
            });
        };
        return (
            <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-ds-foreground">
                    <CircleCheckBig aria-hidden="true" className="size-4 text-ds-success" /> Payment confirmed. You can begin the repair.
                </p>
                <Button onClick={onStart} disabled={startMutation.isPending}>
                    {startMutation.isPending ? 'Starting…' : 'Start repair'}
                </Button>
            </div>
        );
    }

    return <p className="text-sm text-ds-muted-foreground">The repair has not started yet.</p>;
};

export default RepairSection;
