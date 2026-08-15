import { cn } from '../../lib/utils';

// Icon + title + description card for public capability grids (About).
//
// Retained rather than absorbed: eleven live usages across three About
// sections, all rendering the same shape. That is a real repeated pattern, not
// a wrapper kept out of habit.
//
// Phase 5A trimmed it to what is actually used. The old `dark` variant existed
// only for DarkTechSection, which is gone, and the optional `action` link was
// never passed by any caller - both removed rather than carried forward as
// dead options. `icon` stays library-agnostic: size-* sizes any SVG the caller
// hands it.
//
// The wrapper is never a link or button, so the card never implies clickability
// it does not have.
const PublicFeatureCard = ({ icon: Icon, title, description, className }) => (
    <div className={cn('rounded-ds-lg border border-ds-border bg-ds-card p-6', className)}>
        {Icon ? (
            <span className="mb-5 flex size-10 items-center justify-center rounded-ds bg-ds-accent text-ds-primary">
                <Icon className="size-5" aria-hidden="true" />
            </span>
        ) : null}
        <h3 className="text-subhead text-ds-foreground">{title}</h3>
        {description ? <p className="mt-2 text-body-sm text-ds-muted-foreground">{description}</p> : null}
    </div>
);

export default PublicFeatureCard;
