// Shared Motion presets (Phase 7.1) for the `motion` package. Kept small,
// fast and purposeful - subtle entrances and a light page transition, not
// motion on every element. Consumers import a preset and apply it to a
// motion element; they do not re-invent timings per screen.
//
// Reduced motion: wrap the app (or a subtree) in Motion's
// `<MotionConfig reducedMotion="user">` so these presets are automatically
// neutralized when the OS requests reduced motion. Because Motion animates via
// requestAnimationFrame rather than CSS transitions, the global CSS
// prefers-reduced-motion rule in index.css does NOT cover it - use the helper
// below (or MotionConfig) at the point of use. The user-facing wiring ships
// with the App Shell in Phase 7.2; this module only provides the vocabulary.

const EASE_OUT = [0.16, 1, 0.3, 1];

export const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const slideUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
};

// Parent that reveals its children in a light stagger. Pair with staggerItem.
export const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const staggerItem = slideUp;

// For animated route/page mounts (use with AnimatePresence at the shell level).
export const pageTransition = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// Runtime check for call sites that branch on reduced-motion themselves rather
// than relying on MotionConfig.
export function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
