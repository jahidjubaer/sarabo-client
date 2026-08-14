import { Check, X, Minus, Slash } from 'lucide-react';
import { cn } from '../../lib/utils';

// One node of the service spine: the marker and its label.
//
// This is the only place a stage state becomes pixels, so the horizontal and
// vertical spines cannot drift apart. It knows nothing about repair statuses -
// it receives a stage already resolved by utils/repairStage.js.
//
// State is never carried by colour alone. Every non-default state pairs its
// colour with a SHAPE (filled / hollow / dashed / ringed) and an ICON, and
// every state carries screen-reader text. The current stage additionally shows
// a visible "Now" label and is marked with aria-current by its parent list.

// Marker appearance per state.
//
// `current` uses --ds-foreground rather than --ds-ink on purpose: in the dark
// theme --ds-ink is the page ground itself, so an ink dot would vanish.
// --ds-foreground inverts with the theme and stays visible on both.
//
// Marigold (--ds-action) is deliberately absent: it is the action colour, and
// using it here would make a status look like something to click.
const VISUALS = {
    done: {
        marker: 'border-ds-success bg-ds-success text-ds-success-foreground',
        icon: Check,
        label: 'text-ds-muted-foreground',
        sr: 'Completed',
    },
    current: {
        marker: 'border-ds-foreground bg-ds-foreground text-ds-background ring-4 ring-ds-foreground/15',
        icon: null,
        label: 'text-ds-foreground font-semibold',
        sr: 'Current stage',
    },
    upcoming: {
        // --ds-border (1.13:1 on white) made an upcoming marker invisible: a
        // spine with three of its four nodes missing does not read as a spine.
        // The muted foreground at 75% clears 3:1 in both themes while staying
        // clearly secondary to the filled done/current markers.
        marker: 'border-ds-muted-foreground/75 bg-ds-card text-transparent',
        icon: null,
        label: 'text-ds-muted-foreground',
        sr: 'Not started',
    },
    blocked: {
        marker: 'border-ds-destructive bg-ds-destructive text-ds-destructive-foreground',
        icon: X,
        label: 'text-ds-destructive font-semibold',
        sr: 'Stopped here',
    },
    cancelled: {
        marker: 'border-ds-border bg-ds-muted text-ds-muted-foreground',
        icon: Slash,
        label: 'text-ds-muted-foreground line-through',
        sr: 'Cancelled',
    },
    skipped: {
        marker: 'border-dashed border-ds-border bg-ds-card text-ds-muted-foreground',
        icon: Minus,
        label: 'text-ds-muted-foreground',
        sr: 'Not applicable to this repair',
    },
};

function visualsFor(state) {
    return VISUALS[state] || VISUALS.upcoming;
}

// The dot itself. Exported so the spines can place it inside their own
// connector geometry without re-deriving any of the above.
function SpineMarker({ state, className }) {
    const v = visualsFor(state);
    const Icon = v.icon;
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                v.marker,
                className
            )}
        >
            {Icon ? <Icon className="size-3" strokeWidth={3} /> : null}
        </span>
    );
}

// VISIBLE label block only. The accessible state text is deliberately NOT in
// here: the horizontal spine hides this element below `sm`, and anything
// inside a `hidden` element leaves the accessibility tree with it. Screen
// readers are served by SpineStageAnnouncement, which is always rendered.
//
// (The first attempt used `sr-only sm:not-sr-only` on this element. It does
// not work: a media query adds no specificity, and Tailwind emits `sr-only`
// after the `sm:` block, so `sr-only` won at every width and the labels were
// invisible on desktop. Two elements with one job each is also simply clearer.)
// `currentLabel` is the model's contextual "what is happening now" copy. It
// replaces a bare "Now" on the current stage, because the stage label alone
// can mislead: stage 4 is called "Repaired", so a repair still being worked on
// would otherwise read "Repaired / Now" and look finished. With it, the same
// stage reads "Repaired / REPAIR IN PROGRESS".
function SpineStageLabel({ stage, state, currentLabel, className }) {
    const v = visualsFor(state);
    const micro = state === 'current'
        ? (currentLabel || 'Now')
        : state === 'blocked'
            ? (currentLabel || 'Stopped')
            : state === 'skipped' ? 'N/A' : null;
    const microTone = state === 'blocked' ? 'text-ds-destructive' : 'text-ds-muted-foreground';

    return (
        // aria-hidden because SpineStageAnnouncement is the accessible
        // representation of this stage. Without it a screen reader would read
        // the stage twice - "Request: current stage" then "Request Now".
        <span aria-hidden="true" className={cn('flex min-w-0 flex-col gap-0.5', className)}>
            <span className={cn('text-body-sm', v.label)}>{stage.label}</span>
            {micro ? <span className={cn('ds-label', microTone)}>{micro}</span> : null}
        </span>
    );
}

// The single accessible description of a stage: its name and its state, always
// present at every breakpoint, in both orientations. This is what guarantees
// the spine never communicates by colour alone. The current and blocked stages
// announce the contextual copy rather than a generic "current stage", so a
// screen-reader user hears "Repaired: Repair in progress" - never a bare
// "Repaired" on a repair that is still being worked on.
function SpineStageAnnouncement({ stage, state, currentLabel }) {
    const detail = (state === 'current' || state === 'blocked') && currentLabel
        ? currentLabel
        : visualsFor(state).sr;
    return <span className="sr-only">{`${stage.label}: ${detail}`}</span>;
}

// Components only - `visualsFor` stays module-private so this file satisfies
// the fast-refresh boundary rule the project enforces (react-refresh/
// only-export-components), the same convention as ui/button-variants.js.
export { SpineMarker, SpineStageLabel, SpineStageAnnouncement };
