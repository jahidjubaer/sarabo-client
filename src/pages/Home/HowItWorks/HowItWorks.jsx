import { motion as Motion, MotionConfig } from 'motion/react';
import { ClipboardList, UserCheck, Search, FileCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import SectionHeader from '../../../components/public/SectionHeader';
import { HOW_IT_WORKS_STEPS } from '../../../utils/publicContent';
import { staggerContainer, staggerItem } from '../../../theme/motion';

const ICONS = {
    submit: ClipboardList,
    assign: UserCheck,
    inspect: Search,
    quote: FileCheck,
    pay: CreditCard,
    complete: CheckCircle2,
};

// Public "How Sarabo works" (Phase 7.8), redesigned to ds-*. Steps are
// user-facing labels from the content module - never internal status strings.
// `scroll-mt-24` accounts for the sticky navbar so the Hero's "How it works"
// anchor doesn't land underneath it. The numbered sequence is fully legible
// without motion (reduced-motion just skips the entrance).
const HowItWorks = () => (
    <MotionConfig reducedMotion="user">
        <section id="how-it-works" className="scroll-mt-24 bg-ds-muted/40 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <SectionHeader
                    eyebrow="Simple process"
                    title="How Sarabo works"
                    description="A clear, managed workflow from request to completed repair."
                />
                <Motion.ol
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {HOW_IT_WORKS_STEPS.map((step, index) => {
                        const Icon = ICONS[step.key];
                        return (
                            <Motion.li
                                key={step.key}
                                variants={staggerItem}
                                className="rounded-ds-lg border border-ds-border bg-ds-card p-5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ds-primary text-sm font-bold text-ds-primary-foreground">
                                        {index + 1}
                                    </span>
                                    <Icon aria-hidden="true" className="size-5 text-ds-primary" />
                                </div>
                                <h3 className="mt-3 text-base font-semibold text-ds-foreground">{step.title}</h3>
                                <p className="mt-1 text-sm text-ds-muted-foreground">{step.description}</p>
                            </Motion.li>
                        );
                    })}
                </Motion.ol>
            </div>
        </section>
    </MotionConfig>
);

export default HowItWorks;
