import { useLoaderData } from 'react-router';
import Hero from '../Hero/Hero';
import ServiceGateways from '../ServiceGateways/ServiceGateways';
import HowItWorks from '../HowItWorks/HowItWorks';
import AreasTeaser from '../AreasTeaser/AreasTeaser';
import FAQ from '../FAQ/FAQ';
import CTABand from '../../../components/public/CTABand';

// Public homepage (Phase 2 refinement). Five sections and a closing band, each
// built on the same rhythm (eyebrow -> heading -> short line -> visual/action):
//
//   Hero             what is Sarabo, and where do I start? (photo slider)
//   ServiceGateways  what needs repairing? (two large visual entry points)
//   HowItWorks       what happens next? (four steps + the example quote)
//   AreasTeaser      do you cover my district? (search -> map)
//   FAQ              the remaining doubts
//   CTABand          the one action again
const Home = () => {
    const serviceAreas = useLoaderData();
    return (
        <div>
            <Hero />
            <ServiceGateways />
            <HowItWorks />
            <div className="pt-20 lg:pt-28">
                <AreasTeaser areas={serviceAreas} />
            </div>
            <FAQ />
            <CTABand
                headingId="home-final-cta-heading"
                heading="Get your device looked at"
                description="Tell us what is wrong, and an approved technician takes it from there."
            />
        </div>
    );
};

export default Home;
