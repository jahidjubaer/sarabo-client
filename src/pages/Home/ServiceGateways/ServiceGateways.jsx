import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import Reveal from '../../../components/public/Reveal';
import SectionHeader from '../../../components/public/SectionHeader';
import { getServiceGroupAnchor, SERVICE_GROUPS } from '../../../config/serviceGroups';

// "What needs repairing?" as two large visual gateways instead of a grid of
// eight small cards. Each banner is one link into its group on the Services
// page; the photo does the explaining, the overlay carries a title, one line
// and the action. Hover: a slow photo zoom, a deeper scrim and the arrow
// moving - all motion-safe.
const ServiceGateways = () => (
    <section aria-labelledby="home-services-heading" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
            <Reveal>
                <div data-tour="services">
                    <SectionHeader
                        id="home-services-heading"
                        eyebrow="Services"
                        title="What needs repairing?"
                        description="Choose a group to see the devices we repair and their starting prices."
                    />
                </div>
            </Reveal>

            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:gap-6">
                {SERVICE_GROUPS.map((group, index) => (
                    <Reveal as="li" key={group.key} delay={index * 0.08}>
                        <Link
                            to={getServiceGroupAnchor(group.key)}
                            className="focus-ring group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-ds-xl bg-ds-ink sm:aspect-[4/3] lg:aspect-[16/11]"
                        >
                            <img
                                src={group.photo}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                            />
                            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(6_13_16/0.92)] from-10% via-[rgb(6_13_16/0.6)] via-55% to-[rgb(6_13_16/0.12)] transition-opacity duration-500 group-hover:opacity-95" />
                            <span className="flex flex-col items-start gap-3 p-6 sm:p-8">
                                <span className="text-heading text-ds-ink-foreground sm:text-title">{group.title}</span>
                                <span className="max-w-sm text-body-sm text-ds-ink-foreground/80">{group.description}</span>
                                <span className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-ds-card px-5 text-body-sm font-bold text-ds-foreground transition-colors group-hover:bg-ds-action group-hover:text-ds-action-foreground">
                                    Explore services
                                    <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
                                </span>
                            </span>
                        </Link>
                    </Reveal>
                ))}
            </ul>
        </div>
    </section>
);

export default ServiceGateways;
