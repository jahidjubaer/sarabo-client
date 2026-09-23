import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router';
import heroPhoto from '../../../assets/hero-repair-1920.jpg';
import { buttonVariants } from '../../../components/ui/button-variants';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { cn } from '../../../lib/utils';
import { getRequestRepairAction, shouldShowCreateRequestLink, TRACK_REPAIR_ROUTE } from '../../../utils/publicContent';

const HERO_COPY = {
    headlineLead: 'Electronics repair,',
    headlineFollow: 'with a clear next step.',
    description: 'Request a repair, review your quote, and follow the progress from inspection to completion.',
    reassurance: 'Review the quote before repair begins.',
};

const Hero = () => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section className="overflow-hidden border-b border-ds-border">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] lg:gap-10">
                    <div data-tour="request-repair" className="min-w-0 max-w-xl">
                        <h1 className="max-w-[17ch] text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-ds-foreground sm:text-display">
                            <span className="block">{HERO_COPY.headlineLead}</span>
                            <span className="mt-2 block text-ds-primary">{HERO_COPY.headlineFollow}</span>
                        </h1>

                        <p className="mt-6 max-w-lg text-body text-ds-muted-foreground">
                            {HERO_COPY.description}
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            {showRequestCta ? (
                                <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                    Request a repair
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            ) : (
                                <Link to="/dashboard" className={cn(buttonVariants({ variant: 'ink', size: 'lg' }), 'w-full sm:w-auto')}>
                                    <LayoutDashboard aria-hidden="true" />
                                    Open your dashboard
                                </Link>
                            )}

                            <Link to={TRACK_REPAIR_ROUTE} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}>
                                Track a repair
                            </Link>
                        </div>

                        <p className="mt-5 max-w-md text-body-sm text-ds-muted-foreground">
                            {HERO_COPY.reassurance}
                        </p>
                        <a href="#how-it-works" className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-ds text-sm font-semibold text-ds-primary hover:underline">
                            How it works <ArrowRight aria-hidden="true" className="size-4" />
                        </a>
                    </div>

                    <figure className="relative isolate min-w-0 pb-3 pr-3 sm:pb-5 sm:pr-5">
                        <div aria-hidden="true" className="absolute inset-0 left-5 top-5 -z-10 rounded-ds-xl bg-ds-accent" />
                        <div className="overflow-hidden rounded-ds-xl border border-ds-border shadow-sm">
                            <img
                                src={heroPhoto}
                                width="1280"
                                height="720"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                alt="A technician soldering a component onto a circuit board at a repair bench, with a memory module and hand tools laid out beside it."
                                className="aspect-[4/3] w-full object-cover object-[58%_center] lg:aspect-[5/6]"
                            />
                        </div>

                    </figure>
                </div>
            </div>
        </section>
    );
};

export default Hero;
