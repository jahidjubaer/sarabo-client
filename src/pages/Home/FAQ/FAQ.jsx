import { Accordion } from '../../../components/ui/accordion';
import Reveal from '../../../components/public/Reveal';
import SectionHeader from '../../../components/public/SectionHeader';
import { FAQS } from '../../../utils/publicContent';

// FAQ as one cohesive block: a centred header that belongs to the accordion
// directly beneath it, spanning the content width.
const FAQ = () => (
    <section aria-labelledby="home-faq-heading" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
            <Reveal>
                <SectionHeader
                    id="home-faq-heading"
                    align="center"
                    eyebrow="FAQ"
                    title="Common questions"
                    description="Quick answers about how a Sarabo repair works."
                />
            </Reveal>
            <Reveal delay={0.08} className="mt-10">
                <Accordion items={FAQS} defaultOpen={0} />
            </Reveal>
        </div>
    </section>
);

export default FAQ;
