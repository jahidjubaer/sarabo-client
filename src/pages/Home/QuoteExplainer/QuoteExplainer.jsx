import { Link } from 'react-router';
import { Lock } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { buttonVariants } from '../../../components/ui/button-variants';
import { shouldShowCreateRequestLink, getRequestRepairAction } from '../../../utils/publicContent';

// How a quote is put together (Phase 3). Two columns: the argument on the
// left, the quote itself on the right, as in the approved direction.
//
// TRUTHFULNESS: the card has the shape of a real quote - itemised rows, a
// rule, an emphasised total - but no amounts. The platform publishes no fixed
// prices, and the binding number only exists once a technician has inspected
// the device, so a specimen total would be a speculative figure dressed as
// guidance. What is true and useful is the STRUCTURE: the three components the
// server actually stores, summing to a server-computed total in BDT. Each row
// therefore names what it covers where the demo showed a figure.
const ROWS = [
    { key: 'labour', label: 'Labour', copy: 'The technician’s time for the repair itself.' },
    { key: 'parts', label: 'Parts', copy: 'Any components that have to be replaced.' },
    { key: 'additional', label: 'Additional charges', copy: 'Anything else the repair needs, listed separately.' },
];

const QuoteExplainer = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section className="border-t border-ds-border bg-ds-muted/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                    <p className="ds-label text-ds-primary">No surprises</p>
                    <h2 className="mt-3 max-w-[16ch] text-title text-ds-foreground">
                        You see the whole bill before you agree to it.
                    </h2>
                    <p className="mt-4 max-w-md text-body-sm text-ds-muted-foreground">
                        There is no fixed price before the device has been looked at. After the inspection the
                        technician prepares a quote, itemised into three parts, and you decide.
                    </p>
                    {showRequestCta && (
                        <div className="mt-7">
                            <Link to={requestAction.to} className={buttonVariants({ variant: 'ink' })}>
                                {requestAction.label}
                            </Link>
                        </div>
                    )}
                </div>

                {/* The quote card: real structure, no invented figures. */}
                <div className="overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-ds-border bg-ds-muted/60 px-5 py-3">
                        <span className="ds-label text-ds-muted-foreground">What a quote contains</span>
                        <span className="ds-label text-ds-muted-foreground">BDT</span>
                    </div>

                    <ul>
                        {ROWS.map((row) => (
                            <li key={row.key} className="flex items-baseline justify-between gap-6 border-b border-ds-border px-5 py-4">
                                <span className="min-w-0">
                                    <span className="block text-body-sm font-semibold text-ds-foreground">{row.label}</span>
                                    <span className="mt-0.5 block text-micro text-ds-muted-foreground">{row.copy}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-baseline justify-between gap-6 bg-ds-muted/60 px-5 py-4">
                        <span className="text-subhead text-ds-foreground">Quote total</span>
                        <span className="ds-label text-ds-muted-foreground">set after inspection</span>
                    </div>

                    <p className="flex items-start gap-2.5 border-t border-ds-border bg-ds-accent/60 px-5 py-4 text-micro text-ds-accent-foreground">
                        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        Calculated and stored on Sarabo’s server in BDT. Approving is a decision, not a payment —
                        and declining costs you nothing.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default QuoteExplainer;
