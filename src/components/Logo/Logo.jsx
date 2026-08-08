import { Link } from 'react-router';

// Brand lockup (Phase 7.10): a self-contained mark + wordmark, no image asset.
// The "S" mark carries its own ds-primary background + foreground so it is
// legible on any surface (light navbar, dark footer). The wordmark inherits
// currentColor deliberately - the navbar sets text-ds-foreground and the dark
// footer sets text-on-dark, so the same component reads correctly in both
// without hardcoding a theme colour. Sizes are fixed to avoid layout shift.
const Logo = ({ className = '' }) => (
    <Link to="/" aria-label="Sarabo home" className={`focus-ring inline-flex items-center gap-2 rounded-ds ${className}`}>
        <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-ds bg-ds-primary text-base font-bold text-ds-primary-foreground shadow-sm"
        >
            S
        </span>
        <span className="text-xl font-bold tracking-tight">Sarabo</span>
    </Link>
);

export default Logo;
