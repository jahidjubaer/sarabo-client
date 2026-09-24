import { Link } from 'react-router';
import Logo from '../../../components/Logo/Logo';
import { FOOTER_GROUPS } from '../../../utils/publicContent';

// Public footer (redesign Phase 2). An ink band that orients rather than
// sells. Every destination is a route that exists; there are no invented
// contact details, social links, certifications or counts.
//
// Contrast: all text on ink uses ink-foreground (about 13:1) or ink-muted
// (about 6:1). The previous /40 and /50 opacity text measured 3.3-4.3:1.
// In dark mode ink sits below the page ground, so the band stays distinct.
const footerLink = 'focus-ring inline-flex min-h-10 items-center rounded-ds text-body-sm text-ds-ink-foreground transition-colors hover:text-ds-action';

const Footer = () => (
    <footer className="bg-ds-ink text-ds-ink-foreground">
        <div className="mx-auto max-w-6xl lg:max-w-[76rem] px-4 pb-8 pt-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                <div className="col-span-2">
                    <Logo surface="ink" imgClassName="h-9" />
                    <p className="mt-4 max-w-sm text-body-sm text-ds-ink-muted">
                        Managed electronics and appliance repair across Bangladesh, with itemised quotes and trackable progress.
                    </p>
                </div>

                {FOOTER_GROUPS.map((group) => (
                    <nav key={group.heading} aria-labelledby={`footer-${group.heading}`}>
                        <h2 id={`footer-${group.heading}`} className="text-body-sm font-semibold text-ds-ink-muted">{group.heading}</h2>
                        <ul className="mt-3 flex flex-col">
                            {group.links.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className={footerLink}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>

            <div className="mt-10 flex flex-col gap-1 border-t border-ds-ink-foreground/15 pt-6 text-micro text-ds-ink-muted sm:flex-row sm:justify-between">
                <p>&copy; {new Date().getFullYear()} Sarabo</p>
                <p>Prices in BDT (৳)</p>
            </div>
        </div>
    </footer>
);

export default Footer;
