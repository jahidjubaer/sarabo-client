import { Link } from 'react-router';
import Logo from '../../../components/Logo/Logo';
import { FOOTER_GROUPS } from '../../../utils/publicContent';

// Public footer (Phase 7.8). Kept as an intentional always-dark technical
// panel (reads on both light and dark themes, like DarkTechSection) - not a
// light island. Links come from the shared content module and are all verified
// existing routes; no invented Contact/Privacy/Terms/social destinations, so
// no social icons are rendered (no real social links exist).
const footerLinkClass = 'focus-ring inline-block min-h-11 py-2 text-sm text-on-dark/80 hover:text-on-dark';

const Footer = () => (
    <footer className="tech-grid-pattern border-t border-on-dark/10 bg-surface-dark px-4 py-12 text-on-dark sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
                <Logo />
                <p className="mt-4 max-w-xs text-sm text-on-dark/70">
                    Sarabo helps customers submit, manage, and track repair requests through a structured service workflow.
                </p>
            </div>

            {FOOTER_GROUPS.map((group) => (
                <nav key={group.heading} aria-label={group.heading}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-accent">{group.heading}</h3>
                    <ul className="mt-4 flex flex-col gap-1">
                        {group.links.map((link) => (
                            <li key={link.to}><Link to={link.to} className={footerLinkClass}>{link.label}</Link></li>
                        ))}
                    </ul>
                </nav>
            ))}
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-on-dark/10 pt-6 text-center text-xs text-on-dark/60 sm:text-left">
            &copy; {new Date().getFullYear()} Sarabo. All rights reserved.
        </div>
    </footer>
);

export default Footer;
