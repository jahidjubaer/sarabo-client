import { SPINE_STAGES } from '../../../utils/repairStage';
import { SPINE_STEP_COPY } from '../../../utils/publicContent';

// "How it works" (Phase 3) - the ink band, and the section that carries the
// whole idea: the same four stages the product uses everywhere else.
//
// The stage names come from SPINE_STAGES, the single canonical source, so this
// explainer can never drift into a fifth stage or a renamed one. Only the
// explanatory sentences live in the content module.
//
// It does NOT render the ServiceSpine primitive. That component is
// status-driven: every stage it draws is done, current, upcoming, blocked or
// cancelled. This section describes the journey generically - there is no
// repair and therefore no current stage - so it uses its own ink-surface rail
// rather than claiming a state that does not exist, or forcing a variant onto
// the Phase 1 primitive.
//
// The band is always dark in both themes, like the footer, so it is styled
// from the ink token pair rather than the page surface tokens.
//
// `id` and `scroll-mt-24` are preserved: `#how-it-works` is the hero's
// secondary action and a public anchor, and the sticky header would otherwise
// cover the heading.
const HowItWorks = () => (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-4 sm:px-6 lg:px-8">
        <div className="tech-grid-pattern mx-auto max-w-6xl rounded-ds-xl border border-ds-ink-foreground/15 bg-ds-ink px-6 py-14 text-ds-ink-foreground sm:px-10 lg:px-14 lg:py-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="ds-label text-ds-action">How a Sarabo repair runs</p>
                    <h2 className="mt-4 max-w-[18ch] text-title text-ds-ink-foreground">
                        Four stages. You control the one that matters.
                    </h2>
                </div>
                <p className="max-w-md text-body-sm text-ds-ink-foreground/70">
                    Most repair shops go quiet the moment you hand the device over. These four stages follow
                    your repair through every screen in Sarabo.
                </p>
            </div>

            {/* The rail. Markers and connectors are decorative - the ordered
                list and its text carry the meaning, so nothing here depends on
                colour or on the shapes being seen. */}
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {SPINE_STAGES.map((stage, index) => {
                    const isLast = index === SPINE_STAGES.length - 1;
                    return (
                        <li key={stage.key} className="relative">
                            <div className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className="ds-numeric flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ds-ink-foreground/25 bg-ds-ink text-body-sm font-bold text-ds-ink-foreground"
                                >
                                    {stage.stage}
                                </span>
                                {!isLast && (
                                    <span aria-hidden="true" className="hidden h-0.5 flex-1 rounded-full bg-ds-ink-foreground/20 lg:block" />
                                )}
                            </div>
                            <h3 className="mt-5 text-subhead text-ds-ink-foreground">{stage.label}</h3>
                            <p className="mt-2 text-body-sm text-ds-ink-foreground/70">{SPINE_STEP_COPY[stage.key]}</p>
                        </li>
                    );
                })}
            </ol>
        </div>
    </section>
);

export default HowItWorks;
