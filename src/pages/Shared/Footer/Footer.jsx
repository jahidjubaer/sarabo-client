import { Link } from 'react-router';
import Logo from '../../../components/Logo/Logo';

// Only verified existing routes - no invented Contact/Privacy/Terms/Help
// Center/social links. A "Support" column was considered but omitted
// entirely, since no such destination exists yet (see Phase G/I audit).
const exploreLinks = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'Service Areas', to: '/service-areas' },
    { label: 'Track Repair', to: '/track-request' },
    { label: 'About', to: '/about' },
];

// No auth-state branching here - route guards (unchanged) are what actually
// enforce access to /dashboard/create-request and /dashboard.
const accountLinks = [
    { label: 'Request a Repair', to: '/dashboard/create-request' },
    { label: 'Become a Technician', to: '/become-technician' },
    { label: 'Dashboard', to: '/dashboard' },
];

const footerLinkClass = 'focus-ring inline-block min-h-11 py-2 text-sm text-on-dark/80 hover:text-on-dark';

const Footer = () => (
    <footer className="tech-grid-pattern border-t border-on-dark/10 bg-surface-dark px-4 py-12 text-on-dark sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
                <Logo></Logo>
                <p className="mt-4 max-w-xs text-sm text-on-dark/70">
                    Sarabo helps customers submit, manage, and track repair requests through a structured service workflow.
                </p>
            </div>

            <nav aria-label="Explore">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Explore</h3>
                <ul className="mt-4 flex flex-col gap-1">
                    {exploreLinks.map(link => (
                        <li key={link.to}><Link to={link.to} className={footerLinkClass}>{link.label}</Link></li>
                    ))}
                </ul>
            </nav>

            <nav aria-label="Account and service">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Account &amp; Service</h3>
                <ul className="mt-4 flex flex-col gap-1">
                    {accountLinks.map(link => (
                        <li key={link.to}><Link to={link.to} className={footerLinkClass}>{link.label}</Link></li>
                    ))}
                </ul>
            </nav>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-on-dark/10 pt-6 text-center text-xs text-on-dark/60 sm:text-left">
            &copy; {new Date().getFullYear()} Sarabo. All rights reserved.
        </div>
    </footer>
);

export default Footer;
