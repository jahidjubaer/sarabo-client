// Shared heading block for public marketing sections (Home, About, Services).
// Redesigned to ds-* tokens in Phase 7.8. Dashboard pages keep their own
// heading pattern and do not use this. The `dark` variant serves the
// intentional always-dark technical panels (DarkTechSection) with the fixed
// brand-accent/on-dark palette; the light variant now uses the theme-reactive
// ds-* scale so it flips correctly in dark mode instead of staying a light
// island.
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
    const eyebrowClass = isDark ? 'text-brand-accent' : 'text-ds-primary';
    const titleClass = isDark ? 'text-on-dark' : 'text-ds-foreground';
    const descriptionClass = isDark ? 'text-on-dark/70' : 'text-ds-muted-foreground';

    return (
        <div className={`max-w-2xl ${alignClass}`}>
            {eyebrow && (
                <p className={`mb-2 text-sm font-semibold uppercase tracking-wide ${eyebrowClass}`}>
                    {eyebrow}
                </p>
            )}
            <Heading className={`text-2xl font-bold tracking-tight sm:text-3xl ${titleClass}`}>{title}</Heading>
            {description && (
                <p className={`mt-4 text-base leading-relaxed ${descriptionClass}`}>{description}</p>
            )}
        </div>
    );
};

export default SectionHeader;
