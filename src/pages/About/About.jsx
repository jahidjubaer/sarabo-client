import AboutHero from './AboutHero';
import PlatformOverview from './PlatformOverview';
import ProblemAndResponse from './ProblemAndResponse';
import RoleEcosystem from './RoleEcosystem';
import CorePrinciples from './CorePrinciples';
import ManagedWorkflow from './ManagedWorkflow';
import ScopeAndFuture from './ScopeAndFuture';
import AboutFinalCTA from './AboutFinalCTA';

const About = () => {
    return (
        <div>
            <AboutHero></AboutHero>
            <PlatformOverview></PlatformOverview>
            <ProblemAndResponse></ProblemAndResponse>
            <RoleEcosystem></RoleEcosystem>
            <CorePrinciples></CorePrinciples>
            <ManagedWorkflow></ManagedWorkflow>
            <ScopeAndFuture></ScopeAndFuture>
            <AboutFinalCTA></AboutFinalCTA>
        </div>
    );
};

export default About;
