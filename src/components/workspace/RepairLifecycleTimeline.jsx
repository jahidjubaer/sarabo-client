import { Circle, CircleCheck, CircleDot, CircleAlert } from 'lucide-react';
import { getLifecycleStages } from '../../utils/workspacePresentation';
import { cn } from '../../lib/utils';

// Compact vertical lifecycle timeline (Phase 7.6). State is conveyed by icon +
// text + tone (never colour alone): completed steps get a check, the current
// step a filled dot labelled "Current", upcoming steps a hollow circle, and an
// exception (declined/cancelled) an alert. No timestamps are invented.
function StageIcon({ state }) {
    if (state === 'completed') return <CircleCheck aria-hidden="true" className="size-4 text-ds-success" />;
    if (state === 'current') return <CircleDot aria-hidden="true" className="size-4 text-ds-primary" />;
    if (state === 'exception') return <CircleAlert aria-hidden="true" className="size-4 text-ds-destructive" />;
    return <Circle aria-hidden="true" className="size-4 text-ds-muted-foreground" />;
}

function RepairLifecycleTimeline({ request, className }) {
    const { stages, exception } = getLifecycleStages(request);

    return (
        <div className={cn("rounded-ds-lg border border-ds-border bg-ds-card p-4", className)}>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ds-foreground">Repair progress</h2>
                {exception === 'cancelled' && <span className="text-xs font-medium text-ds-muted-foreground">Cancelled</span>}
                {exception === 'declined' && <span className="text-xs font-medium text-ds-destructive">Quote declined</span>}
            </div>
            <ol className="space-y-0">
                {stages.map((stage, index) => (
                    <li key={stage.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <StageIcon state={stage.state} />
                            {index < stages.length - 1 && (
                                <span aria-hidden="true" className={cn("my-0.5 w-px flex-1", stage.state === 'completed' ? 'bg-ds-success/40' : 'bg-ds-border')} />
                            )}
                        </div>
                        <div className={cn("pb-4", index === stages.length - 1 && "pb-0")}>
                            <p className={cn(
                                "text-sm",
                                stage.state === 'current' ? 'font-semibold text-ds-foreground'
                                    : stage.state === 'completed' ? 'text-ds-foreground'
                                        : stage.state === 'exception' ? 'font-medium text-ds-destructive'
                                            : 'text-ds-muted-foreground'
                            )}>
                                {stage.label}
                            </p>
                            {stage.state === 'current' && <p className="text-xs font-medium text-ds-primary">Current stage</p>}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export { RepairLifecycleTimeline };
