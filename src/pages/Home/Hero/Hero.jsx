import { Link } from 'react-router';
import { ArrowRight, Check, LayoutDashboard } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { buttonVariants } from '../../../components/ui/button-variants';
import { HERO, HERO_ASSURANCES, shouldShowCreateRequestLink, getRequestRepairAction } from '../../../utils/publicContent';
import { SPINE_STAGES } from '../../../utils/repairStage';
import { cn } from '../../../lib/utils';
import heroPhoto from '../../../assets/hero-repair-1920.jpg';

// Homepage hero. The strongest section on the page, and the only one above the
// fold with a marigold action.
//
// EDITORIAL BLEED. The photograph is not a card sitting on the page - it is
// pinned to the right edge of the viewport and dissolved into the page ground
// with a gradient, so the copy reads over the same surface the photo fades
// into. That is why the image is absolutely positioned against the section
// rather than living in a grid cell: a grid column cannot escape the centred
// max-w-7xl container that keeps the copy aligned with the header above it.
//
// Below lg the two stack, photograph first as a wide band, copy underneath, so
// the page still opens on something concrete at 320px.
//
// The four stage pills come from SPINE_STAGES - the single source the whole
// product uses - so this hero can never drift into a fifth stage or a renamed
// one. They are deliberately uniform: this is the shape of every repair, not a
// live progress bar, and lighting some of them would imply a repair that does
// not exist.
//
// Role awareness reuses the existing helper: a signed-in technician or admin is
// not shown a customer-only action. Guards remain the access boundary.
const Hero = () => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section className="relative overflow-hidden border-b border-ds-border">
            {/* Photograph. A band above the copy on small screens; the right
                edge of the viewport from lg up. */}
            <div className="relative h-56 w-full sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[46%]">
                {/* One file, declared at its true intrinsic size. There is no
                    srcSet here because there is only one rendition of this
                    photograph - advertising a 960w candidate that is the same
                    bytes as the 1920w one would only mislead the browser's
                    selection. Add a genuinely smaller file and a srcSet back if
                    the mobile download cost ever needs bringing down. */}
                <img
                    src={heroPhoto}
                    width="1280"
                    height="720"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    alt="A technician soldering a component onto a circuit board at a repair bench, with a memory module and hand tools laid out beside it."
                    className="size-full object-cover"
                />
                {/* Two fades, because the photograph meets the page on a
                    different edge at each size. Both are built from the page's
                    own background token, so they resolve correctly in light and
                    dark without a second definition. */}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ds-background via-ds-background/25 to-transparent lg:hidden" />
                <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-ds-background via-ds-background/35 to-transparent lg:block" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <div className="max-w-xl">
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

                    <p className="mt-5 text-body text-ds-muted-foreground">{HERO.description}</p>

                    <ul className="mt-7 flex flex-wrap items-center gap-x-1 gap-y-2">
                        {SPINE_STAGES.map((stage, index) => (
                            <li key={stage.key} className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-2 rounded-full border border-ds-border bg-ds-card/70 px-3.5 py-1.5 text-body-sm font-semibold text-ds-foreground">
                                    <span aria-hidden="true" className="size-1.5 rounded-full bg-ds-primary" />
                                    {stage.label}
                                </span>
                                {/* The connectors are hidden below sm: at 320px
                                    the four pills wrap to two rows, and a
                                    connector left at the end of a row points at
                                    nothing. The reading order still carries the
                                    sequence. */}
                                {index < SPINE_STAGES.length - 1 && (
                                    <span aria-hidden="true" className="hidden h-px w-3 shrink-0 bg-ds-border sm:block" />
                                )}
                            </li>
                        ))}
                    </ul>

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
                    <ul className="mt-8 flex flex-col gap-3 border-t border-ds-border pt-6 sm:flex-row sm:gap-7">
                        {HERO_ASSURANCES.map((item) => (
                            <li key={item} className="flex max-w-[24ch] items-start gap-2 text-body-sm text-ds-muted-foreground">
                                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-primary" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    {/* No attribution line: the photograph currently in
                        src/assets/hero-repair-1920.jpg is not the CC BY-SA
                        image this hero originally shipped with, and crediting
                        the previous photographer for it would be a false
                        attribution. If the replacement's licence requires
                        credit, put that credit back here. */}
                </div>
            </div>
        </section>
    );
};

export default Hero;
