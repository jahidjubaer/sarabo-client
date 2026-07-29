import HeroSwiper from '../HeroSwiper/HeroSwiper';
import ServiceCategories from '../ServiceCategories/ServiceCategories';
import HowItWorks from '../HowItWorks/HowItWorks';
import WhyChooseSarabo from '../WhyChooseSarabo/WhyChooseSarabo';
import RepairLifecycle from '../RepairLifecycle/RepairLifecycle';

const Home = () => {
    return (
        <div>
            <HeroSwiper></HeroSwiper>
            <ServiceCategories></ServiceCategories>
            <HowItWorks></HowItWorks>
            <WhyChooseSarabo></WhyChooseSarabo>
            <RepairLifecycle></RepairLifecycle>
        </div>
    );
};

export default Home;
