import { motion as Motion, MotionConfig } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { HERO } from '../../../utils/publicContent';
import { buttonVariants } from '../../../components/ui/button-variants';
import { slideUp, staggerContainer, staggerItem } from '../../../theme/motion';
import HeroLifecycleVisual from '../../../components/public/HeroLifecycleVisual';

// Public homepage hero (Phase 7.8), redesigned from the former Swiper carousel
// into a single focused, product-specific hero. Copy states exactly what
// Sarabo does (no vague startup language, no fabricated claims). CTAs use real
// routes; the primary points at the request route (guards enforce access), the
// secondary is a same-page anchor to "How it works" (a plain <a> so the browser
// does native hash scrolling instead of routing). The repair-path visual is a
// designed CSS/Motion panel - no stock imagery or fake dashboard screenshots.
const HeroSwiper = () => {
    const secondaryIsAnchor = HERO.secondaryAction.to.startsWith('#');
    const secondaryClass = buttonVariants({ variant: 'outline' });

    return (
        <MotionConfig reducedMotion="user">
            <section className="px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pt-16" aria-label="Sarabo repair service">
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
                    <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="text-center lg:text-left">
                        <Motion.p variants={staggerItem} className="text-sm font-semibold uppercase tracking-wide text-ds-primary">
                            {HERO.eyebrow}
                        </Motion.p>
                        <Motion.h1 variants={staggerItem} className="mt-3 text-3xl font-bold tracking-tight text-ds-foreground sm:text-4xl lg:text-5xl">
                            {HERO.headline}
                        </Motion.h1>
                        <Motion.p variants={staggerItem} className="mx-auto mt-4 max-w-xl text-base text-ds-muted-foreground sm:text-lg lg:mx-0">
                            {HERO.description}
                        </Motion.p>
                        <Motion.div variants={staggerItem} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                            <Link to={HERO.primaryAction.to} className={buttonVariants({ variant: 'default', size: 'lg' })}>
                                {HERO.primaryAction.label} <ArrowRight aria-hidden="true" />
                            </Link>
                            {secondaryIsAnchor ? (
                                <a href={HERO.secondaryAction.to} className={secondaryClass}>{HERO.secondaryAction.label}</a>
                            ) : (
                                <Link to={HERO.secondaryAction.to} className={secondaryClass}>{HERO.secondaryAction.label}</Link>
                            )}
                        </Motion.div>
                        <Motion.p variants={staggerItem} className="mt-4 text-xs text-ds-muted-foreground">
                            No payment is required to submit a repair request.
                        </Motion.p>
                    </Motion.div>

                    <Motion.div variants={slideUp} initial="hidden" animate="show">
                        <HeroLifecycleVisual />
                    </Motion.div>
                </div>
            </section>
        </MotionConfig>
    );
};

export default HeroSwiper;
