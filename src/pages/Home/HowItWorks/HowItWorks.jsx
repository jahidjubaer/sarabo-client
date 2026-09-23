import { ClipboardList, Search, ClipboardCheck, Wrench } from 'lucide-react';
import { SPINE_STAGES } from '../../../utils/repairStage';

const STEP_CONTENT = {
    request: { icon: <ClipboardList aria-hidden="true" className="size-5" />, copy: 'Tell us what needs repair.' },
    inspect: { icon: <Search aria-hidden="true" className="size-5" />, copy: 'A Technician inspects the device and prepares the quote.' },
    approve: { icon: <ClipboardCheck aria-hidden="true" className="size-5" />, copy: 'Review the itemised quote before repair begins.' },
    repaired: { icon: <Wrench aria-hidden="true" className="size-5" />, copy: 'Follow progress through completion and receipt.' },
};

// A generic process, not a live repair status. Stage names stay canonical.
const HowItWorks = () => (
    <section id="how-it-works" aria-labelledby="home-process-heading" className="scroll-mt-24 border-y border-ds-border bg-ds-muted/50 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <div data-tour="repair-process">
                <h2 id="home-process-heading" className="text-title text-ds-foreground">How your repair works</h2>
            </div>
            <ol className="mt-8 grid gap-7 md:mt-10 md:grid-cols-4 md:gap-6">
                {SPINE_STAGES.map((stage, index) => (
                    <li key={stage.key} className="relative flex min-w-0 gap-4 md:block">
                        {index < SPINE_STAGES.length - 1 && (
                            <span aria-hidden="true" className="absolute bottom-[-1.75rem] left-5 top-10 w-px bg-ds-border md:bottom-auto md:left-10 md:right-[-1.5rem] md:top-5 md:h-px md:w-auto" />
                        )}
                        <span aria-hidden="true" className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-ds-primary/30 bg-ds-background font-semibold tabular-nums text-ds-primary">
                            {stage.stage}
                        </span>
                        <div className="min-w-0 pt-1 md:mt-5 md:pt-0">
                            <h3 className="flex items-center gap-2 text-heading text-ds-foreground">
                                <span className="text-ds-primary">{STEP_CONTENT[stage.key].icon}</span>
                                {stage.label}
                            </h3>
                            <p className="mt-2 max-w-xs text-body-sm text-ds-muted-foreground">{STEP_CONTENT[stage.key].copy}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default HowItWorks;
