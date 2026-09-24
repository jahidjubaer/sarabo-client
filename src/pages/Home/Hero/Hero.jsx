import { useEffect, useState } from 'react';
import { ArrowRight, LayoutDashboard, Pause, Play } from 'lucide-react';
import { Link } from 'react-router';
import benchPhoto from '../../../assets/hero-repair-1920.jpg';
import laptopPhoto from '../../../assets/hero-laptop.jpg';
import appliancePhoto from '../../../assets/hero-appliance.jpg';
import { buttonVariants } from '../../../components/ui/button-variants';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { prefersReducedMotion } from '../../../theme/motion';
import { cn } from '../../../lib/utils';
import { HERO, shouldShowCreateRequestLink, TRACK_REPAIR_ROUTE } from '../../../utils/publicContent';

// Three real repair photographs, all the same subject family (a technician at
// work on a device), so the slider reads as one story rather than a gallery.
// `position` keeps the technician in frame on narrow screens.
const SLIDES = [
    { src: benchPhoto, width: 1280, height: 720, position: 'object-[62%_center]', alt: 'A technician soldering a component onto a circuit board at a repair bench.' },
    { src: laptopPhoto, width: 1600, height: 1099, position: 'object-[60%_center]', alt: 'A technician in safety glasses working inside an opened laptop.' },
    { src: appliancePhoto, width: 1000, height: 690, position: 'object-[70%_center]', alt: 'A technician servicing the open indoor unit of a wall-mounted air conditioner.' },
];
const SLIDE_MS = 7000;

// Homepage hero (Phase 2 refinement): a full-bleed photographic slider with
// the message over it - one headline, one line, ONE primary action and a
// quiet text link. Photography is the dominant element; nothing floats on it.
//
// Motion rules: a slow crossfade every 7s, paused while the pointer or
// keyboard focus is inside, stoppable with a visible pause button (WCAG 2.2.2)
// and never started for people who prefer reduced motion. The first slide is
// always the circuit-board photo, so the first impression is immediate.
const Hero = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(() => prefersReducedMotion());
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        if (paused || hovering) return undefined;
        const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), SLIDE_MS);
        return () => clearInterval(timer);
    }, [paused, hovering]);

    const showRequest = shouldShowCreateRequestLink({ user, role });

    return (
        <section
            aria-labelledby="home-hero-heading"
            aria-roledescription="carousel"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false); }}
            className="relative isolate flex min-h-[34rem] overflow-hidden bg-ds-ink sm:min-h-[38rem] lg:h-[calc(100svh-4rem)] lg:max-h-[52rem] lg:min-h-[36rem]"
        >
            {SLIDES.map((slide, slideIndex) => (
                <img
                    key={slide.src}
                    src={slide.src}
                    width={slide.width}
                    height={slide.height}
                    alt={slideIndex === index ? slide.alt : ''}
                    aria-hidden={slideIndex === index ? undefined : true}
                    loading={slideIndex === 0 ? 'eager' : 'lazy'}
                    fetchPriority={slideIndex === 0 ? 'high' : undefined}
                    decoding="async"
                    className={cn(
                        'absolute inset-0 -z-20 size-full object-cover transition-opacity duration-[1200ms] ease-in-out',
                        slide.position,
                        slideIndex === index ? 'opacity-100' : 'opacity-0'
                    )}
                />
            ))}

            {/* Readability: a left-to-right scrim on wide screens, a bottom-up
                one on phones where the text sits low over the photo. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(6_13_16/0.92)] via-[rgb(6_13_16/0.6)] to-[rgb(6_13_16/0.15)] md:bg-gradient-to-r md:from-[rgb(6_13_16/0.88)] md:via-[rgb(6_13_16/0.55)] md:to-transparent" />

            <div className="mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-24 pt-32 sm:px-6 md:justify-center md:pb-20 lg:px-8">
                <div data-tour="request-repair" className="max-w-xl">
                    <p className="ds-eyebrow text-ds-action">{HERO.eyebrow}</p>
                    <h1 id="home-hero-heading" className="mt-4 text-display text-ds-ink-foreground">
                        {HERO.headline}
                    </h1>
                    <p className="mt-5 max-w-md text-body text-ds-ink-foreground/85">{HERO.description}</p>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        {showRequest ? (
                            <Link to="/services" className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                Find a repair service
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}
                        <Link
                            data-tour="track-repair"
                            to={TRACK_REPAIR_ROUTE}
                            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-ds text-body-sm font-semibold text-ds-ink-foreground underline decoration-ds-ink-foreground/40 underline-offset-4 transition-colors hover:decoration-ds-ink-foreground"
                        >
                            Track a repair
                        </Link>
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-6 mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    {SLIDES.map((slide, slideIndex) => (
                        <button
                            key={slide.src}
                            type="button"
                            onClick={() => setIndex(slideIndex)}
                            aria-label={`Show photo ${slideIndex + 1} of ${SLIDES.length}`}
                            aria-current={slideIndex === index ? 'true' : undefined}
                            className="focus-ring group flex h-11 items-center rounded-full px-1"
                        >
                            <span className={cn(
                                'block h-1.5 rounded-full transition-all duration-300',
                                slideIndex === index ? 'w-8 bg-ds-action' : 'w-4 bg-white/45 group-hover:bg-white/80'
                            )} />
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    aria-label={paused ? 'Play photo slideshow' : 'Pause photo slideshow'}
                    className="focus-ring flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                    {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
                </button>
            </div>
        </section>
    );
};

export default Hero;
