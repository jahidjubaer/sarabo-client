import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FLOW_STEPS } from '../../utils/createRequestFlow';

// Guided section navigation for the single-page request form. It is strictly
// presentation state: every step remains mounted in the same RHF form, and
// selecting a step only scrolls to that section. The repair lifecycle is a
// separate ServiceSpine in the context rail.
const RequestFlowSteps = ({ progress, activeStep, onSelect }) => {
    return (
        <nav aria-label="Request form progress" className="rounded-ds-lg border border-ds-border bg-ds-card p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="ds-label text-ds-primary">Request form</p>
                <p className="text-micro text-ds-muted-foreground">
                    {progress?.completedCount || 0} of {progress?.totalCount || 3} detail sections complete
                </p>
            </div>

            <ol className="grid grid-cols-4">
                {FLOW_STEPS.map((step, index) => {
                    // Review is ready once the three detail sections are done,
                    // but it is not itself "completed" before submission.
                    const done = step.id !== 'review' && Boolean(progress?.[step.id]);
                    const isActive = activeStep === step.id;
                    const visualState = isActive ? 'current' : done ? 'done' : 'upcoming';
                    const previousStep = FLOW_STEPS[index - 1];
                    const connectorDone = previousStep && previousStep.id !== 'review' && Boolean(progress?.[previousStep.id]);
                    return (
                        <li key={step.id} className="relative min-w-0">
                            {index > 0 ? (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute right-1/2 top-3 h-px w-full',
                                        connectorDone ? 'bg-ds-success' : 'bg-ds-border'
                                    )}
                                />
                            ) : null}
                            <button
                                type="button"
                                onClick={() => onSelect?.(step.id)}
                                aria-current={isActive ? 'step' : undefined}
                                className={cn(
                                    'focus-ring relative z-10 flex w-full min-w-0 flex-col items-center gap-1.5 rounded-ds px-1 py-1 text-center transition-colors sm:px-2',
                                    isActive ? 'text-ds-primary' : 'text-ds-muted-foreground hover:text-ds-foreground'
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-full border bg-ds-card text-xs font-semibold',
                                        visualState === 'done'
                                            ? 'border-ds-success bg-ds-success text-ds-success-foreground'
                                            : visualState === 'current'
                                                ? 'border-ds-primary text-ds-primary ring-4 ring-ds-primary/15'
                                                : 'border-ds-muted-foreground/60 text-ds-muted-foreground'
                                    )}
                                    aria-hidden="true"
                                >
                                    {visualState === 'done' ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                                </span>
                                <span className="min-w-0 break-words text-[11px] font-semibold leading-tight sm:text-body-sm">{step.label}</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ds-muted-foreground sm:text-[10px]">
                                    {isActive ? 'Current' : done ? 'Done' : 'Upcoming'}
                                </span>
                                <span className="sr-only">{isActive ? 'Current form section' : done ? 'Completed form section' : 'Upcoming form section'}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default RequestFlowSteps;
