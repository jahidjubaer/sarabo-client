import { motion as Motion, MotionConfig } from 'motion/react';
import { Link } from 'react-router';
import { AirVent, Refrigerator, WashingMachine, Tv, Smartphone, Laptop, Microwave, Wrench, ArrowRight } from 'lucide-react';
import SectionHeader from '../../components/public/SectionHeader';
import CTAPanel from '../../components/public/CTAPanel';
import { SERVICE_CATEGORIES, REQUEST_REPAIR_ROUTE, getRequestRepairAction } from '../../utils/publicContent';
import { buttonVariants } from '../../components/ui/button-variants';
import { staggerContainer, staggerItem } from '../../theme/motion';

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

// Public Services page (Phase 7.8), redesigned to ds-*. Categories/blurbs come
// from the shared content module - customer-facing only (no slugs/ids/pricing
// fields). Every card links to the request route; guards enforce access. No
// pricing is shown (no server pricing is fetched here, so none is invented).
const Services = () => (
    <MotionConfig reducedMotion="user">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeader
                title="Our repair services"
                description="From home appliances to personal electronics, verified technicians diagnose and fix the problem through a managed workflow. Pick a category to get started."
            />

            <Motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {SERVICE_CATEGORIES.map((service) => {
                    const Icon = ICONS[service.iconKey] || Wrench;
                    return (
                        <Motion.div
                            key={service.key}
                            variants={staggerItem}
                            className="flex flex-col rounded-ds-lg border border-ds-border bg-ds-card p-6"
                        >
                            <span className="flex size-11 items-center justify-center rounded-ds-lg bg-ds-primary/10 text-ds-primary">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <h3 className="mt-4 text-base font-semibold text-ds-foreground">{service.label}</h3>
                            <p className="mt-2 flex-1 text-sm text-ds-muted-foreground">{service.blurb}</p>
                            <Link to={REQUEST_REPAIR_ROUTE} className="focus-ring mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ds-primary hover:underline">
                                Request this service <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        </Motion.div>
                    );
                })}
            </Motion.div>

            <div className="mx-auto mt-16 max-w-6xl">
                <CTAPanel
                    heading="Can't find your device category?"
                    description='No problem — choose "Other" when creating a request and describe the issue, and we’ll match you with the right technician.'
                    primaryAction={getRequestRepairAction()}
                />
            </div>

            {/* Keep a plain in-flow request link too for users who scroll past. */}
            <div className="mt-8 text-center">
                <Link to={REQUEST_REPAIR_ROUTE} className={buttonVariants({ variant: 'default' })}>Create a repair request</Link>
            </div>
        </div>
    </MotionConfig>
);

export default Services;
