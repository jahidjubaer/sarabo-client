import { Link } from 'react-router';
import { ArrowRight, ClipboardCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import storyPhoto from '../../assets/card-microwave-oven.jpg';
import CTABand from '../../components/public/CTABand';
import Reveal from '../../components/public/Reveal';
import SectionHeader from '../../components/public/SectionHeader';

// Three commitments, each a rule the product enforces rather than a slogan.
const VALUES = [
    { icon: ShieldCheck, title: 'Approved technicians', copy: 'Technicians only take work after an administrator reviews and approves them.' },
    { icon: ReceiptText, title: 'The quote comes first', copy: 'You approve an itemised quote before any repair starts, and pay only after that.' },
    { icon: ClipboardCheck, title: 'Every step on record', copy: 'Inspection, quote, payment, progress and handover are tracked against your request.' },
];

// About (Phase 2 refinement): what Sarabo is and why it exists, how it helps,
// and one next action - in the same eyebrow -> heading -> short text -> visual
// rhythm as the homepage. Deliberately short: not a corporate article.
const About = () => (
    <div>
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <Reveal>
                    <SectionHeader
                        as="h1"
                        id="page-title"
                        eyebrow="About Sarabo"
                        title="Repair should not be a guessing game"
                        description="Getting a device fixed often means handing it over and hoping. Sarabo is a managed repair service for electronics and home appliances across Bangladesh: an approved technician inspects your device, you decide on an itemised quote, and you can see every step."
                    />
                    <Link
                        to="/services"
                        className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-ds text-body-sm font-bold text-ds-primary hover:underline"
                    >
                        See what we repair <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </Reveal>
                <Reveal delay={0.08}>
                    <img
                        src={storyPhoto}
                        width="800"
                        height="800"
                        loading="lazy"
                        decoding="async"
                        alt="A technician opening the casing of a microwave oven with a screwdriver."
                        className="aspect-[5/4] w-full rounded-ds-xl object-cover"
                    />
                </Reveal>
            </div>
        </section>

        <section aria-labelledby="about-values-heading" className="bg-ds-canvas px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-6xl">
                <Reveal>
                    <SectionHeader
                        id="about-values-heading"
                        align="center"
                        eyebrow="Why Sarabo"
                        title="What we hold ourselves to"
                    />
                </Reveal>
                <ul className="mt-12 grid gap-5 md:grid-cols-3">
                    {VALUES.map((value, index) => {
                        const Icon = value.icon;
                        return (
                            <Reveal as="li" key={value.title} delay={index * 0.06} className="rounded-ds-xl border border-ds-border bg-ds-card p-7">
                                <span className="flex size-12 items-center justify-center rounded-full bg-ds-accent text-ds-accent-foreground">
                                    <Icon aria-hidden="true" className="size-6" />
                                </span>
                                <h3 className="mt-5 text-subhead text-ds-foreground">{value.title}</h3>
                                <p className="mt-2 text-body-sm text-ds-muted-foreground">{value.copy}</p>
                            </Reveal>
                        );
                    })}
                </ul>
            </div>
        </section>

        <div className="pt-20 lg:pt-28">
            <CTABand heading="Have something that needs fixing?" description="Choose your device and tell us what is wrong." />
        </div>
    </div>
);

export default About;
