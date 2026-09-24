import Reveal from '../../../components/public/Reveal';
import SectionHeader from '../../../components/public/SectionHeader';
import { SPINE_STAGES } from '../../../utils/repairStage';
import { SPINE_STEP_COPY } from '../../../utils/publicContent';

// Example amounts only - clearly labelled - to show the SHAPE of a real quote
// (labour + parts + additional = total). Real quotes come from the technician
// after inspection.
const EXAMPLE_LINES = [
    ['Labour', 'Screen replacement', '৳1,800'],
    ['Parts', '15.6" display panel', '৳2,600'],
    ['Additional', 'Pickup and return', '৳450'],
];

function QuoteReceipt() {
    return (
        <figure className="rounded-ds-xl border border-ds-border bg-ds-card p-6 shadow-xl sm:p-8">
            <figcaption className="flex items-center justify-between">
                <span className="text-subhead text-ds-foreground">Your repair quote</span>
                <span className="rounded-full bg-ds-muted px-2.5 py-1 text-micro font-bold tracking-wide text-ds-muted-foreground">EXAMPLE</span>
            </figcaption>
            <dl className="mt-6 space-y-3.5">
                {EXAMPLE_LINES.map(([kind, detail, amount]) => (
                    <div key={kind} className="flex items-baseline justify-between gap-4 text-body-sm">
                        <dt className="text-ds-muted-foreground"><span className="font-semibold text-ds-foreground">{kind}</span> · {detail}</dt>
                        <dd className="ds-numeric shrink-0 text-ds-foreground">{amount}</dd>
                    </div>
                ))}
                <div className="flex items-baseline justify-between border-t border-dashed border-ds-input pt-4">
                    <dt className="text-body font-bold text-ds-foreground">Total</dt>
                    <dd className="ds-numeric text-heading text-ds-foreground">৳4,850</dd>
                </div>
            </dl>
            <div aria-hidden="true" className="mt-6 grid grid-cols-2 gap-3">
                <span className="flex h-11 items-center justify-center rounded-ds bg-ds-action text-body-sm font-bold text-ds-action-foreground">Approve &amp; pay</span>
                <span className="flex h-11 items-center justify-center rounded-ds border border-ds-input text-body-sm font-semibold text-ds-foreground">Decline</span>
            </div>
            <p className="mt-4 text-micro text-ds-muted-foreground">Nothing is charged until you approve.</p>
        </figure>
    );
}

// How it works: the four stages a customer later sees on their own repair,
// beside the moment that matters most - the itemised quote they approve or
// decline. One section, one story (this replaces the separate "how it works"
// and "quote explained" sections, which told overlapping halves of it).
const HowItWorks = () => (
    <section id="how-it-works" aria-labelledby="home-process-heading" className="scroll-mt-24 bg-ds-canvas px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
            <Reveal>
                <div data-tour="repair-process">
                    <SectionHeader
                        id="home-process-heading"
                        eyebrow="How it works"
                        title="From request to repaired"
                        description="You see the price before any work starts, and you follow every step."
                    />
                </div>
            </Reveal>

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-20">
                <ol className="space-y-2">
                    {SPINE_STAGES.map((stage, index) => {
                        const decision = stage.key === 'approve';
                        const last = index === SPINE_STAGES.length - 1;
                        return (
                            <Reveal as="li" key={stage.key} delay={index * 0.06} className="relative flex gap-5 pb-6">
                                {!last && <span aria-hidden="true" className="absolute left-[1.375rem] top-12 bottom-0 w-0.5 bg-ds-border" />}
                                <span
                                    aria-hidden="true"
                                    className={decision
                                        ? 'relative flex size-11 shrink-0 items-center justify-center rounded-full bg-ds-action text-body font-extrabold text-ds-action-foreground'
                                        : 'relative flex size-11 shrink-0 items-center justify-center rounded-full bg-ds-ink text-body font-extrabold text-ds-ink-foreground'}
                                >
                                    {stage.stage}
                                </span>
                                <div className="min-w-0 pt-2">
                                    <h3 className="text-subhead text-ds-foreground">{stage.label}</h3>
                                    <p className="mt-1 max-w-md text-body-sm text-ds-muted-foreground">{SPINE_STEP_COPY[stage.key]}</p>
                                </div>
                            </Reveal>
                        );
                    })}
                </ol>
                <Reveal delay={0.1}>
                    <QuoteReceipt />
                </Reveal>
            </div>
        </div>
    </section>
);

export default HowItWorks;
