import { Link } from 'react-router';
import Logo from '../../../components/Logo/Logo';
import { FOOTER_GROUPS } from '../../../utils/publicContent';

// Public footer (Phase 2, service-spine shell). An ink band: petrol surface,
// ink-foreground text, and a restrained two-column navigation beneath the
// brand. It orients rather than sells - no second homepage.
//
// Every destination comes from the shared content module and is a route that
// actually exists. There are deliberately NO social icons, no address, no
// phone number, no customer counts, no certifications and no warranty text:
// none of that is real product data, and inventing it in a footer is still
// inventing it.
//
// Dark-theme note: --ds-ink is the page ground in dark, by design, so the band
// would otherwise merge with the page. The top border is what separates them -
// it is structural here, not decoration.
//
// Marigold is absent on purpose. The action colour belongs to the one primary
// action in the header; a second gold button down here would spend the scarcity
// that makes it work.
const footerLink = 'focus-ring inline-flex min-h-9 items-center rounded-ds text-body-sm text-ds-ink-foreground/70 transition-colors hover:text-ds-ink-foreground';

const Footer = () => (
    <footer className="border-t border-ds-border bg-ds-ink text-ds-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                    <Logo />
                    <p className="mt-4 max-w-sm text-body-sm text-ds-ink-foreground/70">
                        Sarabo manages electronics and appliance repairs end to end &mdash; request, technician
                        assignment, inspection, an agreed quote, and tracked completion.
                    </p>
                </div>

                {FOOTER_GROUPS.map((group) => (
                    <nav key={group.heading} aria-label={group.heading}>
                        <h2 className="ds-label text-ds-ink-foreground/50">{group.heading}</h2>
                        <ul className="mt-4 flex flex-col gap-1">
                            {group.links.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className={footerLink}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>

            <div className="mt-10 flex flex-col gap-2 border-t border-ds-ink-foreground/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-micro text-ds-ink-foreground/50">
                    &copy; {new Date().getFullYear()} Sarabo. All rights reserved.
                </p>
                <p className="ds-label text-ds-ink-foreground/40">Prices in BDT</p>
            </div>
        </div>
    </footer>
);

export default Footer;
