import Hero from '../Hero/Hero';
import HowItWorks from '../HowItWorks/HowItWorks';
import ServiceCatalogue from '../ServiceCatalogue/ServiceCatalogue';
import QuoteExplainer from '../QuoteExplainer/QuoteExplainer';
import FAQ from '../FAQ/FAQ';
import FinalCTA from '../FinalCTA/FinalCTA';

// Public homepage (Phase 3, service-spine redesign).
//
// Six sections, each answering one question, in the order a visitor asks them:
//
//   Hero              what is this, and what do I do next?
//   HowItWorks        what happens after I submit?      (#how-it-works)
//   ServiceCatalogue  can you fix my kind of device?
//   QuoteExplainer    how does pricing work?
//   FAQ               the remaining doubts
//   FinalCTA          the one action again
//
// Weight is deliberately uneven: the hero is the strongest thing on the page
// and carries the only marigold action above the fold, HowItWorks and FAQ sit
// on the muted ground, and the page closes on an ink band that hands off to
// the ink footer.
//
// Retired here (all Home-exclusive, single-importer, verified before deletion):
// the three-slide HeroSwiper carousel and its HeroLifecycleVisual, the
// dismissible WelcomeBanner, the eight hardcoded ServiceCategories cards whose
// marketing aliases did not match the server's canonical slugs, and the
// overlapping WhyChooseSarabo / TrustAndSafety / RepairLifecycle trio.
const Home = () => {
    return (
        <div>
            <Hero />
            <HowItWorks />
            <ServiceCatalogue />
            <QuoteExplainer />
            <FAQ />
            <FinalCTA />
        </div>
    );
};

export default Home;
