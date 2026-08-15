import { Link } from 'react-router';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { buttonVariants } from '../ui/button-variants';
import { shouldShowCreateRequestLink, getRequestRepairAction, TRACK_REPAIR_ROUTE } from '../../utils/publicContent';
import { cn } from '../../lib/utils';

// The closing action band for public pages (Phase 5A).
//
// Replaces CTAPanel, whose light/dark variants and hand-styled buttons predate
// the service-spine system. This is the ink band the approved direction uses to
// close a page and hand off to the ink footer.
//
// One action, in marigold. The tracking link beside it is deliberately
// subordinate - an outline on ink, never a second filled button - so a page
// never offers two equal choices.
//
// Role awareness reuses the shared helper, so a signed-in technician or admin
// is not shown a customer-only action. Route guards remain the access boundary;
// this only decides what is offered.
const CTABand = ({ eyebrow, heading, description }) => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
            <div className="mx-auto max-w-6xl rounded-ds-lg border border-ds-ink-foreground/15 bg-ds-ink px-6 py-12 text-ds-ink-foreground sm:px-10 lg:px-14 lg:py-16">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-xl">
                        {eyebrow ? <p className="ds-label text-ds-ink-muted">{eyebrow}</p> : null}
                        <h2 className="mt-3 text-title text-ds-ink-foreground">{heading}</h2>
                        {description ? (
                            <p className="mt-4 text-body-sm text-ds-ink-foreground/70">{description}</p>
                        ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                        {showRequestCta ? (
                            <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                {requestAction.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}
                        <Link to={TRACK_REPAIR_ROUTE} className={cn(buttonVariants({ variant: 'onInk', size: 'lg' }), 'w-full sm:w-auto')}>
                            Track a repair
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTABand;
