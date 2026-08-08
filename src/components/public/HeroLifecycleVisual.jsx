import { motion as Motion, MotionConfig } from 'motion/react';
import { ClipboardList, Search, FileText, Wrench } from 'lucide-react';
import { HERO_LIFECYCLE } from '../../utils/publicContent';

// Distinctive, self-contained hero visual (Phase 7.8): the four-beat repair
// path Request -> Inspect -> Quote -> Repair, rendered as an always-dark
// technical panel that reads on both light and dark themes. Motion (not
// Anime.js - see phase decision) draws the connecting track and staggers the
// nodes in; under prefers-reduced-motion the full static path still conveys
// the process, so the animation is never load-bearing. The panel is decorative
// relative to the hero copy, but its step labels are real text (not alt-only)
// so the sequence is legible to everyone.
const ICONS = { request: ClipboardList, inspect: Search, quote: FileText, repair: Wrench };

const HeroLifecycleVisual = () => {
    return (
        <MotionConfig reducedMotion="user">
            <div className="tech-grid-pattern relative overflow-hidden rounded-ds-lg border border-on-dark/10 bg-surface-dark p-6 sm:p-8">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_60%)]"
                />
                <p className="relative text-xs font-semibold uppercase tracking-wide text-brand-accent">The repair path</p>

                <div className="relative mt-6">
                    {/* Desktop track behind the nodes; draws in left-to-right. */}
                    <Motion.span
                        aria-hidden="true"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute left-[12%] right-[12%] top-6 hidden h-px origin-left bg-on-dark/25 sm:block"
                    />
                    <ol className="relative grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-3">
                        {HERO_LIFECYCLE.map((step, index) => {
                            const Icon = ICONS[step.key];
                            const isLast = index === HERO_LIFECYCLE.length - 1;
                            return (
                                <li key={step.key} className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                                    <Motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: index * 0.12 }}
                                        className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-accent/40 bg-surface-dark text-brand-accent"
                                    >
                                        <Icon aria-hidden="true" className="size-5" />
                                    </Motion.span>
                                    <div>
                                        <p className="text-sm font-semibold text-on-dark">{step.label}</p>
                                        <p className="text-xs text-on-dark/60">Step {index + 1}</p>
                                    </div>
                                    {/* Mobile connector between stacked steps. */}
                                    {!isLast && <span aria-hidden="true" className="ms-6 h-6 w-px bg-on-dark/20 sm:hidden" />}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </MotionConfig>
    );
};

export default HeroLifecycleVisual;
