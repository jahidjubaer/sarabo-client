import { Link } from 'react-router';
import { FaClipboardList } from 'react-icons/fa';

// This is the page's single <h1>. No photographic asset exists for About yet -
// same CSS-only technical panel approach as Home's Hero, no autoplay/media.
const AboutHero = () => (
    <section className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-10 lg:grid-cols-2 lg:p-16">
        <div className="text-center lg:text-left">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">About Sarabo</p>
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">A Structured Platform for Managing Repair Services</h1>
            <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg lg:mx-0">
                Sarabo brings repair requests, technician assignment, progress tracking, payment records, and service completion into one managed workflow.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm opacity-60 lg:mx-0">
                The platform is designed to help customers, technicians, and administrators work through a clearer and more accountable repair process.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link to="/dashboard/create-request" className="focus-ring btn btn-primary">Request a Repair</Link>
                <Link to="/services" className="focus-ring btn btn-outline">Explore Services</Link>
            </div>
        </div>
        <div
            className="tech-grid-pattern flex aspect-video w-full items-center justify-center rounded-xl bg-surface-dark"
            aria-hidden="true"
        >
            <FaClipboardList className="text-6xl text-brand-accent/80" />
        </div>
    </section>
);

export default AboutHero;
