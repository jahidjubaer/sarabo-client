import { useMemo, useRef, useState } from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, Keyboard, A11y } from 'swiper/modules';
import { Link } from 'react-router';
import { FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa';
import { heroSlides } from './heroSlides';

const AUTOPLAY_DELAY = 6000;

// `to` starting with "#" is a same-page anchor (e.g. "How It Works"), not a
// route - a plain <a> lets the browser do native anchor scrolling instead of
// going through react-router, which has no special same-page hash behavior.
const HeroCta = ({ action, className }) => {
    if (!action) return null;
    if (action.to.startsWith('#')) {
        return <a href={action.to} className={className}>{action.label}</a>;
    }
    return <Link to={action.to} className={className}>{action.label}</Link>;
};

// No repair/device photography exists in the repo yet (only logo.png) - each
// slide's visual panel is a restrained CSS-only technical pattern instead of
// a hotlinked external image. Real-photo placeholders needed later:
//   Slide 1 - a technician repairing a household appliance (e.g. AC/washer)
//   Slide 2 - a repair-tracking/status-timeline photo or screen
//   Slide 3 - a verified technician (ID badge/uniform) at a service visit
const HeroSwiper = () => {
    const swiperRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    const prefersReducedMotion = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    );

    const [autoplayActive, setAutoplayActive] = useState(!prefersReducedMotion);

    const toggleAutoplay = () => {
        const swiper = swiperRef.current;
        if (!swiper) return;
        if (autoplayActive) {
            swiper.autoplay.stop();
            setAutoplayActive(false);
        } else {
            swiper.autoplay.start();
            setAutoplayActive(true);
        }
    };

    return (
        <section className="relative" aria-label="Sarabo highlights">
            <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                modules={[Autoplay, Pagination, Navigation, Keyboard, A11y]}
                rewind
                speed={600}
                autoplay={autoplayActive ? { delay: AUTOPLAY_DELAY, pauseOnMouseEnter: true, disableOnInteraction: false } : false}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                onBeforeInit={(swiper) => {
                    swiper.params.navigation.prevEl = prevRef.current;
                    swiper.params.navigation.nextEl = nextRef.current;
                }}
                navigation={{ prevEl: null, nextEl: null }}
                a11y={{
                    prevSlideMessage: 'Previous slide',
                    nextSlideMessage: 'Next slide',
                    paginationBulletMessage: 'Go to slide {{index}}',
                }}
                className="rounded-2xl pb-10"
            >
                {heroSlides.map((slide) => {
                    const Icon = slide.icon;
                    // Static per-slide, not the active slide's own state - all
                    // three slides stay mounted simultaneously (Swiper doesn't
                    // unmount inactive slides), so the tag must never change
                    // as autoplay cycles, only which slide happens to hold it.
                    const Heading = `h${slide.headingLevel}`;
                    return (
                        <SwiperSlide key={slide.id}>
                            <div className="grid min-h-[420px] grid-cols-1 items-center gap-8 rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-10 lg:grid-cols-2 lg:p-16">
                                <div className="text-center lg:text-left">
                                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{slide.eyebrow}</p>
                                    <Heading className="text-3xl font-bold sm:text-4xl lg:text-5xl">{slide.headline}</Heading>
                                    <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg lg:mx-0">{slide.description}</p>
                                    <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                        <HeroCta action={slide.primaryAction} className="focus-ring btn btn-primary" />
                                        <HeroCta action={slide.secondaryAction} className="focus-ring btn btn-outline" />
                                    </div>
                                </div>
                                <div
                                    className="tech-grid-pattern flex aspect-video w-full items-center justify-center rounded-xl bg-surface-dark"
                                    aria-hidden="true"
                                >
                                    <Icon className="text-6xl text-brand-accent/80" />
                                </div>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            <button
                ref={prevRef}
                type="button"
                aria-label="Previous slide"
                className="focus-ring btn btn-circle btn-sm absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 bg-base-100 lg:flex"
            >
                <FaChevronLeft aria-hidden="true" />
            </button>
            <button
                ref={nextRef}
                type="button"
                aria-label="Next slide"
                className="focus-ring btn btn-circle btn-sm absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 bg-base-100 lg:flex"
            >
                <FaChevronRight aria-hidden="true" />
            </button>

            <div className="mt-4 flex justify-center">
                <button type="button" onClick={toggleAutoplay} className="focus-ring btn btn-ghost btn-sm gap-2">
                    {autoplayActive ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
                    {autoplayActive ? 'Pause automatic slides' : 'Resume automatic slides'}
                </button>
            </div>
        </section>
    );
};

export default HeroSwiper;
