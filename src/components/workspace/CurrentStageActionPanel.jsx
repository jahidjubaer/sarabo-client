import { ArrowDown, CircleAlert, Clock, CircleCheckBig, Info, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { LoadingButton } from '../common/LoadingButton';
import { getWorkspaceNextStep, getTechnicianAdvance } from '../../utils/workspacePresentation';
import { isAssignmentDecisionPending } from '../../utils/assignmentDecision';
import { cn } from '../../lib/utils';

const TONE_STYLES = {
    action: { wrap: 'border-ds-primary/30 bg-ds-primary/5', icon: 'text-ds-primary', Icon: CircleAlert },
    waiting: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Clock },
    done: { wrap: 'border-ds-success/30 bg-ds-success/5', icon: 'text-ds-success', Icon: CircleCheckBig },
    info: { wrap: 'border-ds-border bg-ds-card', icon: 'text-ds-muted-foreground', Icon: Info },
    neutral: { wrap: 'border-ds-border bg-ds-muted/40', icon: 'text-ds-muted-foreground', Icon: Info },
};

// Role-aware current-stage panel. Existing assignment and early status
// mutations stay here. `featured` and `actionTarget` only let the isolated
// Technician composition establish visual priority and link to an existing
// authoritative form further down the same page.
function CurrentStageActionPanel({
    request,
    viewerRole,
    isAssignedTechnicianView,
    onAdvance,
    advancing,
    onAccept,
    onReject,
    deciding,
    featured = false,
    actionTarget,
    actionLabel,
}) {
    const next = getWorkspaceNextStep({ request, viewerRole });
    const tone = TONE_STYLES[next.tone] || TONE_STYLES.info;
    const Icon = tone.Icon;
    const pendingDecision = isAssignedTechnicianView && isAssignmentDecisionPending(request);
    const advance = isAssignedTechnicianView && !pendingDecision ? getTechnicianAdvance({ request }) : null;
    const headingId = `current-stage-action-${request?._id || 'request'}`;

    return (
        <section aria-labelledby={headingId} className={cn('rounded-ds-lg border', featured ? 'p-5 sm:p-6' : 'p-4', tone.wrap)}>
            <div className="flex items-start gap-3">
                <span className={cn(featured ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-ds-background/70' : 'mt-0.5 shrink-0', tone.icon)}>
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    {featured && <p className="ds-label text-ds-muted-foreground">Next operational action</p>}
                    <h2 id={headingId} className={cn('font-semibold text-ds-foreground', featured ? 'mt-1 text-xl tracking-tight' : 'text-sm')}>
                        {next.title}
                    </h2>
                    {next.description && <p className="mt-0.5 text-sm text-ds-muted-foreground">{next.description}</p>}

                    {pendingDecision && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <LoadingButton size="sm" variant={featured ? 'action' : 'default'} loading={deciding} loadingText="Working..." onClick={onAccept}>
                                <Check aria-hidden="true" /> Accept assignment
                            </LoadingButton>
                            <Button size="sm" variant="outline" className="text-ds-destructive hover:text-ds-destructive" onClick={onReject} disabled={deciding}>
                                <X aria-hidden="true" /> Reject
                            </Button>
                        </div>
                    )}

                    {advance && (
                        <div className="mt-3">
                            <Button size="sm" variant={featured ? 'action' : 'default'} onClick={() => onAdvance(advance.nextStatus)} disabled={advancing}>
                                {advancing ? 'Updating...' : advance.label}
                            </Button>
                        </div>
                    )}

                    {!pendingDecision && !advance && actionTarget && actionLabel && (
                        <a href={actionTarget} className={cn(buttonVariants({ variant: 'action', size: 'sm' }), 'mt-3')}>
                            {actionLabel}
                            <ArrowDown aria-hidden="true" />
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}

export { CurrentStageActionPanel };
