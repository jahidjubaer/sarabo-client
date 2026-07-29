import React from 'react';
import { Link } from 'react-router';

// Minimal shared card for public feature/value-prop grids. Not for
// dashboard tables/rows. The wrapper itself is never a link/button - only
// the optional `action` is focusable/clickable, so the card never implies
// clickability it doesn't have.
const PublicFeatureCard = ({ icon: Icon, title, description, action, variant = 'light' }) => {
    const isDark = variant === 'dark';
    const cardClass = isDark
        ? 'bg-white/5 border border-on-dark/10 text-on-dark'
        : 'bg-base-100 border border-base-300 text-base-content';
    const iconClass = isDark ? 'text-brand-accent' : 'text-primary';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'opacity-70';
    const actionClass = isDark ? 'text-brand-accent' : 'text-primary';

    return (
        <div className={`rounded-xl p-6 shadow-sm ${cardClass}`}>
            {Icon && <Icon className={`text-3xl mb-3 ${iconClass}`} aria-hidden="true" />}
            <h3 className="text-xl font-semibold">{title}</h3>
            {description && <p className={`mt-2 text-sm ${descriptionClass}`}>{description}</p>}
            {action && (
                <Link to={action.to} className={`focus-ring inline-block mt-4 text-sm font-semibold hover:underline ${actionClass}`}>
                    {action.label}
                </Link>
            )}
        </div>
    );
};

export default PublicFeatureCard;
