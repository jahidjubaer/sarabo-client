import { motion as Motion } from 'motion/react';

// A subtle fade-and-rise as a block scrolls into view, once. Used on public
// section content only - never on dashboards. The root MotionConfig
// (reducedMotion="user", main.jsx) turns it into an instant appearance for
// people who ask for reduced motion.
function Reveal({ children, delay = 0, className, as = 'div' }) {
    const Component = Motion[as] || Motion.div;
    return (
        <Component
            className={className}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
            transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </Component>
    );
}

export default Reveal;
