import { Outlet } from 'react-router';
import Logo from '../components/Logo/Logo';
import { SPINE_STAGES } from '../utils/repairStage';
import { HERO } from '../utils/publicContent';

// Auth shell (Phase 6). An ink/paper split: the brand panel is the ink surface
// used everywhere else in the redesign (footer, how-it-works band, CTA bands),
// and the form sits on paper beside it.
//
// The old layout was a DaisyUI `hero` with a gradient, a react-icons wrench and
// the line "Trusted Repair Service / Verified technicians, transparent pricing,
// and secure online payment". That was decoration plus an unearned trust claim,
// so it is gone. What replaces it is the product's own spine: the four stage
// names come from SPINE_STAGES - the single canonical source - and the sentence
// above them is the approved hero copy, reused verbatim rather than reinvented.
// Nothing here is a new claim.
//
// Below lg the ink panel is not rendered at all: the form gets the full width
// with a compact brand header above it, so nothing is squeezed at 320px.
const AuthLayout = () => (
    <div className="min-h-dvh bg-ds-background text-ds-foreground lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Brand panel - always ink, in both themes, like the footer. */}
        <aside className="tech-grid-pattern hidden border-r border-ds-ink-foreground/15 bg-ds-ink px-10 py-14 text-ds-ink-foreground lg:flex lg:flex-col lg:justify-between xl:px-14">
            <Logo to="/" className="text-ds-ink-foreground" surface="ink" />

            <div className="max-w-sm">
                <p className="ds-label text-ds-action">{HERO.eyebrow}</p>
                <p className="mt-4 text-title text-ds-ink-foreground">
                    {HERO.headlineLead} {HERO.headlineAccent}
                </p>

                <ol className="mt-10 flex flex-col gap-5">
                    {SPINE_STAGES.map((stage) => (
                        <li key={stage.key} className="flex items-center gap-4">
                            <span
                                aria-hidden="true"
                                className="ds-numeric flex size-8 shrink-0 items-center justify-center rounded-full border border-ds-ink-foreground/25 text-body-sm font-bold text-ds-ink-foreground"
                            >
                                {stage.stage}
                            </span>
                            <span className="text-body-sm text-ds-ink-foreground/80">{stage.label}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <p className="text-micro text-ds-ink-foreground/50">Sarabo</p>
        </aside>

        {/* Form column. It carries the card surface rather than the page ground
            because in the dark palette `--ds-ink` and `--ds-background` are the
            same colour by design - so a form column on the page ground would
            make the whole ink/paper split vanish into one flat field. On card
            (#13212a over #0b1519) the two halves stay legibly distinct, and in
            light the card is white, i.e. indistinguishable from the page, which
            is exactly the intended look there. */}
        <div className="flex min-h-dvh flex-col bg-ds-card px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <div className="lg:hidden">
                <Logo to="/" />
            </div>

            <main className="flex flex-1 items-center justify-center py-10">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </main>
        </div>
    </div>
);

export default AuthLayout;
