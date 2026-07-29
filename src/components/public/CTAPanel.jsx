import React from 'react';
import { Link } from 'react-router';

// Shared CTA panel reusable by Home and About. Carries no auth/role logic -
// `to` destinations are plain routes; whether a user may actually land there
// is enforced by the route guards, not by this component.
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
        ? 'bg-surface-dark tech-grid-pattern text-on-dark'
        : 'bg-base-200 text-base-content';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'opacity-70';
    const secondaryBtnClass = isDark
        ? 'btn btn-outline border-on-dark/40 text-on-dark hover:bg-white/10 focus-ring'
        : 'btn btn-outline focus-ring';

    return (
        <div className={`rounded-2xl p-8 text-center ${wrapperClass}`}>
            {eyebrow && (
                <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-brand-accent' : 'text-primary'}`}>
                    {eyebrow}
                </p>
            )}
            <h2 className="text-2xl font-semibold">{heading}</h2>
            {description && <p className={`mt-2 ${descriptionClass}`}>{description}</p>}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                {primaryAction && (
                    <Link to={primaryAction.to} className="btn btn-primary focus-ring">
                        {primaryAction.label}
                    </Link>
                )}
                {secondaryAction && (
                    <Link to={secondaryAction.to} className={secondaryBtnClass}>
                        {secondaryAction.label}
                    </Link>
                )}
            </div>
        </div>
    );
};

export default CTAPanel;
