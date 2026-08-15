import { Link } from 'react-router';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import ServiceSpine from '../../components/spine/ServiceSpine';
import { buttonVariants } from '../../components/ui/button-variants';
import { shouldShowCreateRequestLink, getRequestRepairAction } from '../../utils/publicContent';
import { getExampleJourneyModel } from '../Home/exampleJourney';
import { cn } from '../../lib/utils';

// The page's single <h1> (Phase 5A). Copy is unchanged from the reviewed
// version - both paragraphs are preserved verbatim.
//
// The old right-hand panel was a decorative clipboard glyph on a dark tile.
// It is replaced by the same illustrative journey the homepage uses, which
// says something true about the product instead of filling space. It carries
// its own caption and no tracking code, name, timestamp or amount.
//
// Role awareness reuses the shared helper, so a signed-in technician or admin
// is not offered a customer-only action.
const AboutHero = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const showRequestCta = shouldShowCreateRequestLink({ user, role });
    const requestAction = getRequestRepairAction();

    return (
        <section className="px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                <div className="min-w-0">
                    <p className="ds-label text-ds-primary">About Sarabo</p>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ds-foreground sm:text-4xl lg:text-display">
                        A structured platform for managing repair services
                    </h1>
                    <p className="mt-5 max-w-xl text-body text-ds-muted-foreground">
                        Sarabo brings repair requests, technician assignment, progress tracking, payment records,
                        and service completion into one managed workflow.
                    </p>
                    <p className="mt-4 max-w-xl text-body-sm text-ds-muted-foreground">
                        The platform is designed to help customers, technicians, and administrators work through a
                        clearer and more accountable repair process.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {showRequestCta ? (
                            <Link to={requestAction.to} className={cn(buttonVariants({ variant: 'action', size: 'lg' }), 'w-full sm:w-auto')}>
                                {requestAction.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <Link to="/dashboard" className={cn(buttonVariants({ variant: 'ink', size: 'lg' }), 'w-full sm:w-auto')}>
                                <LayoutDashboard aria-hidden="true" />
                                Open your dashboard
                            </Link>
                        )}
                        <Link to="/services" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}>
                            Explore services
                        </Link>
                    </div>
                </div>

                <div className="tech-grid-pattern min-w-0 rounded-ds-xl border border-ds-ink-foreground/15 bg-ds-ink p-5 sm:p-7">
                    <p className="ds-label text-ds-ink-muted">Example repair journey</p>
                    <div className="mt-4 rounded-ds-lg border border-ds-border bg-ds-card p-5 shadow-lg sm:p-6">
                        <p className="text-subhead text-ds-foreground">Every repair moves through the same four stages.</p>
                        <div className="mt-5">
                            <ServiceSpine model={getExampleJourneyModel(3)} orientation="vertical" />
                        </div>
                    </div>
                    <p className="mt-4 text-micro text-ds-ink-foreground/60">
                        An illustration of the four stages, not a live repair.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default AboutHero;
