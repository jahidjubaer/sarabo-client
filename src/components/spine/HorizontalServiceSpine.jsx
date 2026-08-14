import { SpineMarker, SpineStageLabel, SpineStageAnnouncement } from './SpineStage';
import { getSpineCounter, getFlowCaption } from '../../utils/repairStage';
import { cn } from '../../lib/utils';

// Horizontal service spine - the wide form, for heroes, cards and page headers.
//
// Semantics: an ordered list, because the stages are a sequence and their order
// carries meaning. The current stage is marked with aria-current="step", and
// every stage carries screen-reader state text from SpineStageLabel, so the
// progression is fully available without seeing any colour.
//
// Responsive rule: four labels do not fit across a 320px screen. Below `sm`
// the labels become screen-reader-only and a single summary line underneath
// says where the repair is ("Stage 3 of 4 - Approve"). Nothing is lost to
// assistive tech, nothing overflows, and no horizontal scrollbar appears. From
// `sm` up, every label is visible under its own marker.
//
// No animation: the spine is legible at rest, which is also what a
// reduced-motion user would get, so there is nothing to disable.

// A connector is "traversed" only when the stage behind it actually completed.
// The untraversed line uses the muted foreground at 40% rather than
// --ds-border, which at 1.13:1 on white was invisible at 2px.
function connectorClass(state) {
    return state === 'done' ? 'bg-ds-success' : 'bg-ds-muted-foreground/40';
}

const HorizontalServiceSpine = ({ model, className }) => {
    if (!model) return null;

    const counter = getSpineCounter(model);
    const caption = getFlowCaption(model);

    return (
        <div className={cn('w-full', className)}>
            <ol className="flex w-full items-start">
                {model.stages.map((stage, index) => {
                    const isLast = index === model.stages.length - 1;
                    const isCurrent = stage.state === 'current';
                    return (
                        <li
                            key={stage.key}
                            aria-current={isCurrent ? 'step' : undefined}
                            className={cn('min-w-0', isLast ? 'flex-none' : 'flex-1')}
                        >
                            <div className="flex items-center gap-2">
                                <SpineMarker state={stage.state} />
                                {!isLast ? (
                                    <span
                                        aria-hidden="true"
                                        className={cn('h-0.5 flex-1 rounded-full', connectorClass(stage.state))}
                                    />
                                ) : null}
                            </div>
                            {/* Always announced; shown from `sm` up, where four
                                labels fit without overflowing. */}
                            <SpineStageAnnouncement stage={stage} state={stage.state} currentLabel={model.currentLabel} />
                            <SpineStageLabel
                                stage={stage}
                                state={stage.state}
                                currentLabel={model.currentLabel}
                                className="mt-2 hidden pr-3 sm:flex"
                            />
                        </li>
                    );
                })}
            </ol>

            {/* Below `sm` this line carries the position the hidden labels
                would have shown. The flow caption appears at every width,
                because "cancelled" or "stopped" is never a detail. */}
            {(counter || caption) && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {counter ? (
                        <span className="ds-label text-ds-muted-foreground sm:hidden">
                            Stage {counter.current} of {counter.total} &middot; {model.currentLabel || model.label}
                        </span>
                    ) : null}
                    {caption ? <span className="ds-label text-ds-muted-foreground">{caption}</span> : null}
                </p>
            )}
        </div>
    );
};

export default HorizontalServiceSpine;
