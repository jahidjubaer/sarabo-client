import { Link } from 'react-router';
import { buttonVariants } from '../ui/button-variants';

// Shared CTA panel reusable by Home and About (redesigned ds-* in Phase 7.8).
// Carries no auth/role logic - `to` destinations are plain routes; whether a
// user may actually land there is enforced by the route guards, not here.
// The light variant uses the theme-reactive ds-* scale; the dark variant is an
// intentional always-dark technical panel and keeps the fixed brand palette
// (ds buttons would mis-theme on a fixed-dark surface in light mode, so its
// buttons are hand-styled to the on-dark/brand-accent palette).
const CTAPanel = ({
    eyebrow,
    heading,
    description,
    primaryAction,
    secondaryAction,
    variant = 'light',
}) => {
    const isDark = variant === 'dark';
    const wrapperClass = isDark
        ? 'tech-grid-pattern bg-surface-dark text-on-dark'
        : 'border border-ds-border bg-ds-muted/40 text-ds-foreground';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'text-ds-muted-foreground';

    const primaryClass = isDark
        ? 'focus-ring inline-flex h-10 items-center justify-center rounded-ds px-5 text-sm font-medium bg-brand-accent text-surface-dark hover:bg-brand-accent/90'
        : `${buttonVariants({ variant: 'default' })}`;
    const secondaryClass = isDark
        ? 'focus-ring inline-flex h-10 items-center justify-center rounded-ds border border-on-dark/40 px-5 text-sm font-medium text-on-dark hover:bg-white/10'
        : `${buttonVariants({ variant: 'outline' })}`;

    return (
        <div className={`rounded-ds-lg p-8 text-center ${wrapperClass}`}>
            {eyebrow && (
                <p className={`mb-2 text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-brand-accent' : 'text-ds-primary'}`}>
                    {eyebrow}
                </p>
            )}
            <h2 className="text-xl font-semibold sm:text-2xl">{heading}</h2>
            {description && <p className={`mt-2 ${descriptionClass}`}>{description}</p>}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {primaryAction && (
                    <Link to={primaryAction.to} className={primaryClass}>{primaryAction.label}</Link>
                )}
                {secondaryAction && (
                    <Link to={secondaryAction.to} className={secondaryClass}>{secondaryAction.label}</Link>
                )}
            </div>
        </div>
    );
};

export default CTAPanel;
