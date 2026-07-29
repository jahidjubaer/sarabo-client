import { FaClipboardList, FaUserCheck, FaRoute, FaCheckCircle } from 'react-icons/fa';
import SectionHeader from '../../../components/public/SectionHeader';

const steps = [
    { icon: FaClipboardList, title: 'Submit Request', description: 'Share your device and repair issue through the request form.' },
    { icon: FaUserCheck, title: 'Technician Assigned', description: 'An approved technician is assigned through the managed service workflow.' },
    { icon: FaRoute, title: 'Repair and Track', description: 'Follow repair progress through clear status updates.' },
    { icon: FaCheckCircle, title: 'Complete Service', description: 'Review the completed service details and payment history where applicable.' },
];

// `scroll-mt-24` accounts for the sticky Navbar so the anchor target doesn't
// land underneath it when reached via the Hero's "How It Works" link.
const HowItWorks = () => (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Simple Process"
            title="How Sarabo Works"
            description="A clear, managed workflow from request to completed repair."
        />
        <div className="relative mt-12">
            {/* Connector line sits behind the numbered circles - each circle's
            solid background visually breaks it, so no per-item width math is needed. */}
            <div className="absolute inset-x-[12%] top-6 hidden h-0.5 bg-base-300 lg:block" aria-hidden="true"></div>
            <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <li key={step.title} className="flex flex-col items-center gap-2 text-center">
                            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-content">
                                {index + 1}
                            </div>
                            <Icon className="text-2xl text-primary" aria-hidden="true" />
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                            <p className="text-sm opacity-70">{step.description}</p>
                        </li>
                    );
                })}
            </ol>
        </div>
    </section>
);

export default HowItWorks;
