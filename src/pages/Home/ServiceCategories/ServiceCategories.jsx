import { motion as Motion, MotionConfig } from 'motion/react';
import { Link } from 'react-router';
import { AirVent, Refrigerator, WashingMachine, Tv, Smartphone, Laptop, Microwave, Wrench } from 'lucide-react';
import SectionHeader from '../../../components/public/SectionHeader';
import { SERVICE_CATEGORIES, REQUEST_REPAIR_ROUTE } from '../../../utils/publicContent';
import { staggerContainer, staggerItem } from '../../../theme/motion';

// Decorative icon lookup keyed by the content module's iconKey (not a taxonomy).
const ICONS = {
    ac: AirVent,
    refrigerator: Refrigerator,
    'washing-machine': WashingMachine,
    tv: Tv,
    mobile: Smartphone,
    laptop: Laptop,
    microwave: Microwave,
    other: Wrench,
};

// Popular service categories (Phase 7.8), redesigned from the Swiper carousel
// into a responsive ds-* grid. Labels/blurbs come from the content module -
// customer-facing only, never slugs/serviceDefinitionIds. Each card links to
// the request route (guards enforce access). No pricing is shown here (no
// server pricing is fetched on this section, so none is invented).
const ServiceCategories = () => (
    <MotionConfig reducedMotion="user">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader
                eyebrow="What we repair"
                title="Popular service categories"
                description="Browse the most requested repair categories on Sarabo."
            />
            <Motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.15 }}
                className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
                {SERVICE_CATEGORIES.map((category) => {
                    const Icon = ICONS[category.iconKey] || Wrench;
                    return (
                        <Motion.li key={category.key} variants={staggerItem}>
                            <Link
                                to={REQUEST_REPAIR_ROUTE}
                                className="focus-ring flex h-full flex-col rounded-ds-lg border border-ds-border bg-ds-card p-5 text-left transition-colors hover:border-ds-primary/50"
                            >
                                <span className="flex size-10 items-center justify-center rounded-ds-lg bg-ds-primary/10 text-ds-primary">
                                    <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <span className="mt-3 text-sm font-semibold text-ds-foreground">{category.label}</span>
                                <span className="mt-1 text-xs text-ds-muted-foreground">{category.blurb}</span>
                            </Link>
                        </Motion.li>
                    );
                })}
            </Motion.ul>
        </section>
    </MotionConfig>
);

export default ServiceCategories;
