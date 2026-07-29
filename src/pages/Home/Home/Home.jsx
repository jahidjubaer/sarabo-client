import HeroSwiper from '../HeroSwiper/HeroSwiper';
import ServiceCategories from '../ServiceCategories/ServiceCategories';
import HowItWorks from '../HowItWorks/HowItWorks';
import WhyChooseSarabo from '../WhyChooseSarabo/WhyChooseSarabo';
import RepairLifecycle from '../RepairLifecycle/RepairLifecycle';
import TrustAndSafety from '../TrustAndSafety/TrustAndSafety';
import FAQ from '../FAQ/FAQ';
import FinalCTA from '../FinalCTA/FinalCTA';

const Home = () => {
    return (
        <div>
            <HeroSwiper></HeroSwiper>
            <ServiceCategories></ServiceCategories>
            <HowItWorks></HowItWorks>
            <WhyChooseSarabo></WhyChooseSarabo>
            <RepairLifecycle></RepairLifecycle>
            <TrustAndSafety></TrustAndSafety>
            <FAQ></FAQ>
            <FinalCTA></FinalCTA>
        </div>
    );
};

export default Home;
