import { useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion, MotionConfig } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone, Laptop, Tv, AirVent, Refrigerator, WashingMachine, UserCheck, FileText, CreditCard, Wrench, CheckCircle2 } from 'lucide-react';
import { HERO, HERO_SLIDES } from '../../../utils/publicContent';
import { buttonVariants } from '../../../components/ui/button-variants';
import { prefersReducedMotion } from '../../../theme/motion';
import HeroLifecycleVisual from '../../../components/public/HeroLifecycleVisual';

const AUTO_ADVANCE_MS = 7000;

// Devices visual (slide 2): a compact dark panel of real device categories.
function DevicesVisual() {
    const items = [
        { icon: Smartphone, label: 'Smartphone' },
        { icon: Laptop, label: 'Laptop' },
        { icon: Tv, label: 'TV' },
        { icon: AirVent, label: 'AC' },
        { icon: Refrigerator, label: 'Fridge' },
        { icon: WashingMachine, label: 'Washer' },
    ];
    return (
        <div className="tech-grid-pattern rounded-ds-lg border border-on-dark/10 bg-surface-dark p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Device categories</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
                {items.map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2 rounded-ds-lg border border-on-dark/10 bg-white/5 p-3 text-center">
                        <item.icon aria-hidden="true" className="size-6 text-brand-accent" />
                        <span className="text-xs text-on-dark">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Process visual (slide 3): the accountable end-to-end chain.
function ProcessVisual() {
    const steps = [
        { icon: UserCheck, label: 'Assignment' },
        { icon: FileText, label: 'Quote' },
        { icon: CreditCard, label: 'Payment' },
        { icon: Wrench, label: 'Progress' },
        { icon: CheckCircle2, label: 'Completion' },
    ];
    return (
        <div className="tech-grid-pattern rounded-ds-lg border border-on-dark/10 bg-surface-dark p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">End-to-end tracking</p>
            <ol className="mt-5 space-y-3">
                {steps.map((item, i) => (
                    <li key={item.label} className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brand-accent/40 bg-white/5 text-xs font-semibold text-brand-accent">{i + 1}</span>
                        <item.icon aria-hidden="true" className="size-4 text-brand-accent" />
                        <span className="text-sm text-on-dark">{item.label}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function SlideVisual({ visual }) {
    if (visual === 'devices') return <DevicesVisual />;
    if (visual === 'process') return <ProcessVisual />;
    return <HeroLifecycleVisual />;
}

// Public homepage hero carousel (Phase 7.10). Purpose-built with React state +
// Motion - NO Swiper. Three grounded slides (no stats/guarantees). Auto-advances
// every 7s, pauses on hover/focus, supports prev/next + dot tabs + Left/Right
// arrow keys, announces the current slide to assistive tech, and is fully
// reduced-motion aware (auto-advance disabled, transitions minimal). CTAs use
// real routes (guards enforce access); the secondary is a same-page anchor.
const HeroSwiper = () => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reduce] = useState(() => prefersReducedMotion());
    const count = HERO_SLIDES.length;
    const slide = HERO_SLIDES[index];

    const go = (next) => setIndex((next + count) % count);

    useEffect(() => {
        if (paused || reduce) return undefined;
        const id = setInterval(() => setIndex((prev) => (prev + 1) % count), AUTO_ADVANCE_MS);
        return () => clearInterval(id);
    }, [paused, reduce, count]);

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    };

    return (
        <MotionConfig reducedMotion="user">
            <section
                aria-roledescription="carousel"
                aria-label="Sarabo highlights"
                className="px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pt-16"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
                onKeyDown={onKeyDown}
            >
                <div className="sr-only" aria-live="polite">Slide {index + 1} of {count}: {slide.eyebrow}</div>

                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
                    <div className="text-center lg:text-left">
                        <AnimatePresence mode="wait">
                            <Motion.div key={slide.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                                <p className="text-sm font-semibold uppercase tracking-wide text-ds-primary">{slide.eyebrow}</p>
                                <h1 className="mt-3 text-3xl font-bold tracking-tight text-ds-foreground sm:text-4xl lg:text-5xl">{slide.headline}</h1>
                                <p className="mx-auto mt-4 max-w-xl text-base text-ds-muted-foreground sm:text-lg lg:mx-0">{slide.description}</p>
                            </Motion.div>
                        </AnimatePresence>

                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                            <Link to={HERO.primaryAction.to} className={buttonVariants({ variant: 'default', size: 'lg' })}>
                                {HERO.primaryAction.label} <ArrowRight aria-hidden="true" />
                            </Link>
                            <a href={HERO.secondaryAction.to} className={buttonVariants({ variant: 'outline' })}>{HERO.secondaryAction.label}</a>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="focus-ring inline-flex size-9 items-center justify-center rounded-full border border-ds-border text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground">
                                <ChevronLeft aria-hidden="true" className="size-5" />
                            </button>
                            <div role="tablist" aria-label="Choose slide" className="flex items-center gap-2">
                                {HERO_SLIDES.map((s, i) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={i === index}
                                        aria-label={`Go to slide ${i + 1}`}
                                        onClick={() => setIndex(i)}
                                        className={`focus-ring h-2 rounded-full transition-all ${i === index ? 'w-6 bg-ds-primary' : 'w-2 bg-ds-border hover:bg-ds-muted-foreground'}`}
                                    />
                                ))}
                            </div>
                            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="focus-ring inline-flex size-9 items-center justify-center rounded-full border border-ds-border text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground">
                                <ChevronRight aria-hidden="true" className="size-5" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <Motion.div key={slide.key} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
                            <SlideVisual visual={slide.visual} />
                        </Motion.div>
                    </AnimatePresence>
                </div>
            </section>
        </MotionConfig>
    );
};

export default HeroSwiper;
