import { SpineMarker, SpineStageLabel, SpineStageAnnouncement } from './SpineStage';
import { getFlowCaption } from '../../utils/repairStage';
import { cn } from '../../lib/utils';

// Vertical service spine - the tall form, for the public tracking page, detail
// panels and anywhere a stage carries supporting detail.
//
// Same ordered-list semantics and the same resolved model as the horizontal
// spine, so the two can never describe different progress. The vertical form
// needs no responsive fallback: it stacks naturally and reads at 320px, which
// is why it is the better choice on narrow screens or when each stage has a
// timestamp or a sentence beside it.
//
// `detailsByKey` is optional supporting content, keyed by stage key, e.g.
//   { inspect: <time>13 Aug, 10:22</time> }
// The spine renders whatever it is given; it never fabricates a timestamp for
// a stage that has none.

// Same reasoning as the horizontal connector: --ds-border is too faint to
// carry a 2px rail.
function railClass(state) {
    return state === 'done' ? 'bg-ds-success' : 'bg-ds-muted-foreground/40';
}

const VerticalServiceSpine = ({ model, detailsByKey, className }) => {
    if (!model) return null;

    const caption = getFlowCaption(model);

    return (
        <div className={cn('w-full', className)}>
            <ol className="flex w-full flex-col">
                {model.stages.map((stage, index) => {
                    const isLast = index === model.stages.length - 1;
                    const isCurrent = stage.state === 'current';
                    const detail = detailsByKey?.[stage.key];
                    return (
                        <li
                            key={stage.key}
                            aria-current={isCurrent ? 'step' : undefined}
                            className="flex gap-3"
                        >
                            {/* Marker column, with the rail running between markers. */}
                            <div className="flex flex-col items-center self-stretch">
                                <SpineMarker state={stage.state} />
                                {!isLast ? (
                                    <span
                                        aria-hidden="true"
                                        className={cn('w-0.5 flex-1 rounded-full', railClass(stage.state))}
                                    />
                                ) : null}
                            </div>

                            {/* Content column. */}
                            <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
                                <SpineStageAnnouncement stage={stage} state={stage.state} currentLabel={model.currentLabel} />
                                <SpineStageLabel stage={stage} state={stage.state} currentLabel={model.currentLabel} />
                                {detail ? (
                                    <div className="mt-1 text-micro text-ds-muted-foreground">{detail}</div>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {caption ? <p className="ds-label mt-3 text-ds-muted-foreground">{caption}</p> : null}
        </div>
    );
};

export default VerticalServiceSpine;
