import { CircleAlert, Clock, CircleCheckBig, Info, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';
import { getWorkspaceNextStep, getTechnicianAdvance } from '../../utils/workspacePresentation';
import { isAssignmentDecisionPending } from '../../utils/assignmentDecision';
import { cn } from '../../lib/utils';

// Role-aware "what to do next" panel near the top of the workspace (Phase 7.6).
// It answers the current stage in one place instead of making the user hunt
// through sections. For the technician's early generic-status stages
// (driver_assigned → rider_arriving → device received, and legacy completion)
// it renders the ACTUAL advance control here via onAdvance (PATCH
// /parcels/:id/status). Phase 8.2: at assignment_pending the assigned
// technician instead gets Accept / Reject controls (their own dedicated
// endpoints), since the request must be accepted before pickup can begin.
const TONE_STYLES = {
    action: { wrap: 'border-ds-primary/30 bg-ds-primary/5', icon: 'text-ds-primary', Icon: CircleAlert },
    waiting: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Clock },
    done: { wrap: 'border-ds-success/30 bg-ds-success/5', icon: 'text-ds-success', Icon: CircleCheckBig },
    info: { wrap: 'border-ds-border bg-ds-card', icon: 'text-ds-muted-foreground', Icon: Info },
    neutral: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Info },
};

function CurrentStageActionPanel({ request, viewerRole, isAssignedTechnicianView, onAdvance, advancing, onAccept, onReject, deciding }) {
    const next = getWorkspaceNextStep({ request, viewerRole });
    const tone = TONE_STYLES[next.tone] || TONE_STYLES.info;
    const Icon = tone.Icon;
    const pendingDecision = isAssignedTechnicianView && isAssignmentDecisionPending(request);
    const advance = isAssignedTechnicianView && !pendingDecision ? getTechnicianAdvance({ request }) : null;

    return (
        <div className={cn("rounded-ds-lg border p-4", tone.wrap)}>
            <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 shrink-0", tone.icon)}><Icon aria-hidden="true" className="size-5" /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ds-foreground">{next.title}</p>
                    {next.description && <p className="mt-0.5 text-sm text-ds-muted-foreground">{next.description}</p>}

                    {pendingDecision && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <LoadingButton size="sm" loading={deciding} loadingText="Working…" onClick={onAccept}>
                                <Check aria-hidden="true" /> Accept assignment
                            </LoadingButton>
                            <Button size="sm" variant="outline" className="text-ds-destructive hover:text-ds-destructive" onClick={onReject} disabled={deciding}>
                                <X aria-hidden="true" /> Reject
                            </Button>
                        </div>
                    )}

                    {advance && (
                        <div className="mt-3">
                            <Button size="sm" onClick={() => onAdvance(advance.nextStatus)} disabled={advancing}>
                                {advancing ? 'Updating…' : advance.label}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export { CurrentStageActionPanel };
