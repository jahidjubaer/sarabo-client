import { Link } from 'react-router';

// Minimal shared card for public feature/value-prop grids (Home, About).
// Redesigned to ds-* tokens in Phase 7.8. The wrapper itself is never a
// link/button - only the optional `action` is focusable/clickable, so the card
// never implies clickability it doesn't have. `icon` is library-agnostic:
// size-* sizes both Lucide (Home) and react-icons (About) SVGs, so callers on
// either icon set render consistently. The `dark` variant keeps the fixed
// brand palette for use inside always-dark technical panels.
const PublicFeatureCard = ({ icon: Icon, title, description, action, variant = 'light' }) => {
    const isDark = variant === 'dark';
    const cardClass = isDark
        ? 'border border-on-dark/10 bg-white/5 text-on-dark'
        : 'border border-ds-border bg-ds-card text-ds-card-foreground';
    const iconWrapClass = isDark ? 'bg-white/10 text-brand-accent' : 'bg-ds-primary/10 text-ds-primary';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'text-ds-muted-foreground';
    const actionClass = isDark ? 'text-brand-accent' : 'text-ds-primary';

    return (
        <div className={`rounded-ds-lg p-6 shadow-sm ${cardClass}`}>
            {Icon && (
                <span className={`mb-4 flex size-10 items-center justify-center rounded-ds-lg ${iconWrapClass}`}>
                    <Icon className="size-5" aria-hidden="true" />
                </span>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
            {description && <p className={`mt-2 text-sm ${descriptionClass}`}>{description}</p>}
            {action && (
                <Link to={action.to} className={`focus-ring mt-4 inline-block text-sm font-semibold hover:underline ${actionClass}`}>
                    {action.label}
                </Link>
            )}
        </div>
    );
};

export default PublicFeatureCard;
