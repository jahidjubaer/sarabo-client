import React from 'react';

// Shared heading block for public marketing sections (Home, About, Services).
// Dashboard pages keep their existing plain heading pattern and do not use this.
const SectionHeader = ({
    eyebrow,
    title,
    description,
    align = 'center',
    variant = 'light',
    level = 2,
}) => {
    const Heading = `h${level}`;
    const alignClass = align === 'left' ? 'text-left' : 'text-center mx-auto';
    const isDark = variant === 'dark';
    const eyebrowClass = isDark ? 'text-brand-accent' : 'text-primary';
    const titleClass = isDark ? 'text-on-dark' : 'text-base-content';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'opacity-70';

    return (
        <div className={`max-w-2xl ${alignClass}`}>
            {eyebrow && (
                <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${eyebrowClass}`}>
                    {eyebrow}
                </p>
            )}
            <Heading className={`text-3xl font-bold ${titleClass}`}>{title}</Heading>
            {description && (
                <p className={`mt-4 text-base leading-relaxed ${descriptionClass}`}>{description}</p>
            )}
        </div>
    );
};

export default SectionHeader;
