import { Link } from 'react-router';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { buttonVariants } from '../../../components/ui/button-variants';
import { shouldShowCreateRequestLink, getRequestRepairAction, TRACK_REPAIR_ROUTE } from '../../../utils/publicContent';
import { cn } from '../../../lib/utils';

// Closing action (Phase 3). An ink band so the page ends on the brand surface
// and hands off cleanly to the ink footer beneath it.
//
// One action, in marigold. The tracking link beside it is deliberately
// subordinate - an outline on ink, not a second filled button - so the page
// never offers two equal choices. Role awareness reuses the shared helper, so
// a technician or admin is not shown a customer-only action.
const FinalCTA = () => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section aria-labelledby="home-final-cta-heading" className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-20">
            <div className="mx-auto max-w-6xl rounded-ds-lg border border-ds-ink-foreground/15 bg-ds-ink px-6 py-8 text-ds-ink-foreground sm:px-8 sm:py-10 lg:px-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <div className="min-w-0 max-w-lg">
                        <h2 id="home-final-cta-heading" className="text-title text-ds-ink-foreground">
                            Ready to get your device repaired?
                        </h2>
                        <p className="mt-3 text-body-sm text-ds-ink-foreground/80">
                            Start a request and follow the repair from inspection to completion.
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-sm">
                        {showRequestCta ? (
                            <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                Request a repair
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}
                        <Link data-tour="track-repair" to={TRACK_REPAIR_ROUTE} className={cn(buttonVariants({ variant: 'onInk', size: 'lg' }), 'w-full sm:w-auto')}>
                            Track a repair
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;
