import { Link } from 'react-router';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import { buttonVariants } from '../ui/button-variants';
import { shouldShowCreateRequestLink, getRequestRepairAction, TRACK_REPAIR_ROUTE } from '../../utils/publicContent';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

// The one closing band for public pages: an ink panel with one marigold
// action and a subordinate tracking link. A signed-in technician or admin is
// not offered the customer-only action; they get a quiet dashboard link
// instead, so the band never shows two filled buttons. Route guards remain the
// access boundary.
const CTABand = ({ eyebrow = 'Get started', heading, description, headingId = 'cta-band-heading' }) => {
    const { user } = useAuth();
    const { role } = useRole();

    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section aria-labelledby={headingId} className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <Reveal className="mx-auto max-w-6xl rounded-ds-xl bg-ds-ink px-6 py-10 text-ds-ink-foreground sm:px-10 lg:px-14 lg:py-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <SectionHeader id={headingId} tone="ink" eyebrow={eyebrow} title={heading} description={description} />

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                        {showRequestCta ? (
                            <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                {requestAction.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'onInk', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}
                        <Link to={TRACK_REPAIR_ROUTE} className={cn(buttonVariants({ variant: 'onInk', size: 'lg' }), 'w-full sm:w-auto')}>
                            Track a repair
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    );
};

export default CTABand;
