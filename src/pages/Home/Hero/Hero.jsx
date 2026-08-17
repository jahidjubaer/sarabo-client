import { Link } from 'react-router';
import { ArrowRight, Check, LayoutDashboard } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import ServiceSpine from '../../../components/spine/ServiceSpine';
import { buttonVariants } from '../../../components/ui/button-variants';
import { HERO, HERO_ASSURANCES, shouldShowCreateRequestLink, getRequestRepairAction } from '../../../utils/publicContent';
import { getExampleJourneyModel } from '../exampleJourney';
import { cn } from '../../../lib/utils';
import heroPhoto960 from '../../../assets/hero-repair-960.jpg';
import heroPhoto1920 from '../../../assets/hero-repair-1920.jpg';

// Homepage hero (Phase 3). The strongest section on the page, and the only one
// above the fold with a marigold action.
//
// Asymmetric two-column on lg (copy 7 / showcase 5) rather than a centred SaaS
// block. Below lg the two stack, copy first, so the page stays action-first at
// 320px.
//
// The showcase is an INK panel holding a light card - the composition from the
// approved direction. The card itself is explicitly illustrative: it shows the
// shape of the four-stage journey and carries no tracking code, device, name,
// timestamp or amount, and says so in its own caption. See exampleJourney.js.
//
// Role awareness reuses the existing helper: a signed-in technician or admin is
// not shown a customer-only action. Guards remain the access boundary.
const Hero = () => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();
    const exampleModel = getExampleJourneyModel(3);

    return (
        <section className="px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                <div className="min-w-0">
                    <p className="ds-label text-ds-primary">{HERO.eyebrow}</p>

                    {/* The one highlighted word. A marigold underline behind a
                        single noun, not a coloured heading - the action colour
                        stays scarce even when it appears in type. */}
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ds-foreground sm:text-4xl lg:text-display">
                        {HERO.headlineLead}{' '}
                        <em className="not-italic bg-[linear-gradient(180deg,transparent_62%,var(--ds-action)_62%,var(--ds-action)_92%,transparent_92%)] px-0.5">
                            {HERO.headlineAccent}
                        </em>
                    </h1>

                    <p className="mt-5 max-w-xl text-body text-ds-muted-foreground">{HERO.description}</p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        {showRequestCta ? (
                            <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                {requestAction.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'ink', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}

                        <a href="#how-it-works" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}>
                            How it works
                        </a>
                    </div>

                    {/* Three short, verifiable statements - each one describes a
                        mechanism the platform actually enforces. */}
                    <ul className="mt-8 flex flex-col gap-3 border-t border-ds-border pt-6 sm:flex-row sm:gap-8">
                        {HERO_ASSURANCES.map((item) => (
                            <li key={item} className="flex max-w-[24ch] items-start gap-2 text-body-sm text-ds-muted-foreground">
                                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-primary" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Ink showcase. The panel is always dark in both themes - it is
                    a deliberate brand surface, like the footer - so the card
                    inside keeps its own light tokens and reads on either.
                    The photograph is the top plate of that same panel rather
                    than a separate floating image, so the composition reads as
                    one editorial object: photo, then the four-stage card, then
                    the caption. */}
                <div className="tech-grid-pattern min-w-0 overflow-hidden rounded-ds-xl border border-ds-ink-foreground/15 bg-ds-ink">
                    {/* Real workbench photograph. The marigold hairline under it
                        is the only accent on the image - nothing is overlaid on
                        the photo itself, so no figure can be mistaken for a
                        live statistic. */}
                    <figure className="relative m-0">
                        <img
                            src={heroPhoto1920}
                            srcSet={`${heroPhoto960} 960w, ${heroPhoto1920} 1920w`}
                            sizes="(min-width: 1024px) 42vw, 100vw"
                            width="1920"
                            height="1272"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            alt="A technician's hands lifting the heatsink off an opened laptop mainboard at a repair bench, with removed screws sorted into labelled compartments behind."
                            className="block h-56 w-full object-cover sm:h-64 lg:h-72"
                        />
                        {/* Ties the photograph into the ink panel instead of
                            letting it sit on top as a pasted rectangle. */}
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--ds-ink)_100%)] opacity-80" />
                        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-ds-action" />
                    </figure>

                    <div className="p-5 sm:p-7">
                        <p className="ds-label text-ds-ink-muted">Example repair journey</p>

                        <div className="mt-4 rounded-ds-lg border border-ds-border bg-ds-card p-5 shadow-lg sm:p-6">
                            <p className="text-subhead text-ds-foreground">Every repair moves through the same four stages.</p>
                            <div className="mt-5">
                                <ServiceSpine model={exampleModel} orientation="vertical" />
                            </div>
                        </div>

                        <p className="mt-4 text-micro text-ds-ink-foreground/60">
                            An illustration of the four stages, not a live repair. Your own request shows its real
                            stage once you submit it.
                        </p>
                        {/* CC BY-SA 4.0 requires visible attribution wherever the
                            photograph is shown. */}
                        <p className="mt-3 border-t border-ds-ink-foreground/10 pt-3 text-micro text-ds-ink-foreground/40">
                            Photograph: “Computer repair in progress” by Vintechcomputerservices, Wikimedia Commons, CC BY-SA 4.0.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
