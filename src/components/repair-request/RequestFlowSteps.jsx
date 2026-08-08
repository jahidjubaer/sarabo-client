import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FLOW_STEPS } from '../../utils/createRequestFlow';

// Compact, sticky section indicator for the guided single-page create flow
// (Phase 7.7). Presentation only: it reflects the `progress` snapshot derived
// from form values (createRequestFlow.js#deriveFlowProgress) and lets the
// customer jump to a section. Completion is conveyed by BOTH a check icon and
// the "Done" text - never colour alone. Each step is a real <button> so the
// stepper is fully keyboard-operable; aria-current marks the active section.
const RequestFlowSteps = ({ progress, activeStep, onSelect }) => {
    return (
        <nav aria-label="Request progress" className="rounded-ds-lg border border-ds-border bg-ds-card p-2">
            <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
                {FLOW_STEPS.map((step, index) => {
                    const done = progress?.[step.id];
                    const isActive = activeStep === step.id;
                    return (
                        <li key={step.id} className="flex items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => onSelect?.(step.id)}
                                aria-current={isActive ? 'step' : undefined}
                                className={cn(
                                    'focus-ring flex items-center gap-2 rounded-ds px-2.5 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-ds-primary/10 text-ds-primary'
                                        : 'text-ds-muted-foreground hover:bg-ds-muted/60 hover:text-ds-foreground'
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-5 shrink-0 items-center justify-center rounded-full border text-xs',
                                        done
                                            ? 'border-ds-success bg-ds-success/15 text-ds-success'
                                            : isActive
                                                ? 'border-ds-primary text-ds-primary'
                                                : 'border-ds-border text-ds-muted-foreground'
                                    )}
                                    aria-hidden="true"
                                >
                                    {done ? <Check className="size-3" /> : index + 1}
                                </span>
                                <span>{step.label}</span>
                                {done ? <span className="sr-only">(done)</span> : null}
                            </button>
                            {index < FLOW_STEPS.length - 1 && (
                                <span aria-hidden="true" className="hidden h-px w-4 bg-ds-border sm:block" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default RequestFlowSteps;
