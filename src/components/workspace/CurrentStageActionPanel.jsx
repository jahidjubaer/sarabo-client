import { CircleAlert, Clock, CircleCheckBig, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { getWorkspaceNextStep, getTechnicianAdvance } from '../../utils/workspacePresentation';
import { cn } from '../../lib/utils';

// Role-aware "what to do next" panel near the top of the workspace (Phase 7.6).
// It answers the current stage in one place instead of making the user hunt
// through sections. For the technician's early generic-status stages
// (driver_assigned → rider_arriving → device received, and legacy completion)
// it renders the ACTUAL advance control here - relocating it from the Assigned
// Jobs list - calling the existing PATCH /parcels/:id/status via onAdvance.
const TONE_STYLES = {
    action: { wrap: 'border-ds-primary/30 bg-ds-primary/5', icon: 'text-ds-primary', Icon: CircleAlert },
    waiting: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Clock },
    done: { wrap: 'border-ds-success/30 bg-ds-success/5', icon: 'text-ds-success', Icon: CircleCheckBig },
    info: { wrap: 'border-ds-border bg-ds-card', icon: 'text-ds-muted-foreground', Icon: Info },
    neutral: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Info },
};

function CurrentStageActionPanel({ request, viewerRole, isAssignedTechnicianView, onAdvance, advancing }) {
    const next = getWorkspaceNextStep({ request, viewerRole });
    const tone = TONE_STYLES[next.tone] || TONE_STYLES.info;
    const Icon = tone.Icon;
    const advance = isAssignedTechnicianView ? getTechnicianAdvance({ request }) : null;

    return (
        <div className={cn("rounded-ds-lg border p-4", tone.wrap)}>
            <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 shrink-0", tone.icon)}><Icon aria-hidden="true" className="size-5" /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ds-foreground">{next.title}</p>
                    {next.description && <p className="mt-0.5 text-sm text-ds-muted-foreground">{next.description}</p>}
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
