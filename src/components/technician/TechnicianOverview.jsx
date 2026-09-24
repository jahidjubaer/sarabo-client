import { Link } from 'react-router';
import { motion as Motion } from 'motion/react';
import { ArrowRight, Briefcase, Star } from 'lucide-react';
import { useTechnicianJobs } from '../../hooks/useTechnicianJobs';
import { useTechnicianWallet } from '../../hooks/useTechnicianWallet';
import { useTechnicianReviews } from '../../hooks/useTechnicianFeedback';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { Section } from '../common/Section';
import { buttonVariants } from '../ui/button-variants';
import { JobRow } from './JobRow';
import { OfferCard } from './OfferCard';
import { getJobGroup } from '../../utils/technicianJobPresentation';
import { getRequestStatus } from '../../utils/customerRequestPresentation';
import { formatMoney } from '../../utils/currency';
import { staggerContainer, staggerItem } from '../../theme/motion';

const byOldest = (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
const byNewest = (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);

// Three numbers a technician checks every day, each a link to where it lives.
// Values come from existing reads (the wallet and the reviews list); a value
// that has not loaded shows a dash, never a false zero.
function QueueStrip({ activeCount }) {
    const { data: wallet } = useTechnicianWallet();
    const { data: reviews } = useTechnicianReviews(1);
    const available = wallet ? formatMoney(wallet.availableBalance ?? 0, wallet.currency || 'BDT') : '—';
    const rating = typeof reviews?.averageRating === 'number' && reviews.reviewCount > 0 ? reviews.averageRating.toFixed(1) : null;

    const tile = 'focus-ring flex flex-col gap-0.5 bg-ds-card px-5 py-4 transition-colors hover:bg-ds-muted/60';
    return (
        <nav aria-label="Your numbers" className="grid grid-cols-3 gap-px overflow-hidden rounded-ds-lg border border-ds-border bg-ds-border">
            <Link to="/dashboard/wallet" className={tile}>
                <span className="text-micro font-semibold text-ds-muted-foreground">Available to withdraw</span>
                <span className="ds-numeric text-subhead text-ds-foreground">{available}</span>
            </Link>
            <Link to="/dashboard/assigned-jobs" className={tile}>
                <span className="text-micro font-semibold text-ds-muted-foreground">Active jobs</span>
                <span className="text-subhead text-ds-foreground">{activeCount}</span>
            </Link>
            <Link to="/dashboard/profile" className={tile}>
                <span className="text-micro font-semibold text-ds-muted-foreground">Rating</span>
                <span className="flex items-center gap-1 text-subhead text-ds-foreground">
                    {rating ? <><Star aria-hidden="true" className="size-4 fill-ds-action text-ds-action" />{rating}</> : '—'}
                </span>
            </Link>
        </nav>
    );
}

// Technician home (Phase 4): a work queue, in the order work should be done.
//
//   New offers           accept or decline right here (time-sensitive)
//   Needs you            everything else waiting on the technician, oldest
//                        first, so work is handled in the order it arrived
//   In repair            repairs under way - a Continue link, no alarm
//   Waiting on customer  quote decisions and payments
// Completed jobs live on their own page.
function TechnicianOverview() {
    const { jobs, isInitialLoading, isUnavailableBeforeData, retry, pending, advance, accept, decline } = useTechnicianJobs();

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Work queue" />
                <CardSkeleton className="h-20" />
                <CardSkeleton className="h-40" />
            </div>
        );
    }

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Work queue" />
                <ErrorState title="Couldn't load your jobs" description="We couldn't load your assigned work right now. Please try again." onRetry={retry} />
            </div>
        );
    }

    const offers = jobs.filter((job) => getRequestStatus(job) === 'assignment_pending').sort(byOldest);
    const needsYou = jobs.filter((job) => getJobGroup(job) === 'needs-attention' && getRequestStatus(job) !== 'assignment_pending').sort(byOldest);
    const inRepair = jobs.filter((job) => getJobGroup(job) === 'in-repair').sort(byNewest);
    const waiting = jobs.filter((job) => getJobGroup(job) === 'waiting').sort(byNewest);
    const active = offers.length + needsYou.length + inRepair.length + waiting.length;

    const description = active === 0
        ? 'No open jobs right now.'
        : [
            offers.length ? `${offers.length} new offer${offers.length === 1 ? '' : 's'}` : null,
            needsYou.length ? `${needsYou.length} need${needsYou.length === 1 ? 's' : ''} you` : null,
            inRepair.length ? `${inRepair.length} in repair` : null,
        ].filter(Boolean).join(' · ') || 'Waiting on customers.';

    return (
        <div className="space-y-8">
            <PageHeader
                title="Work queue"
                description={description}
                actions={<Link to="/dashboard/completed-jobs" className={buttonVariants({ variant: 'outline' })}>Completed jobs</Link>}
            />

            <QueueStrip activeCount={active} />

            {active === 0 ? (
                <EmptyState icon={Briefcase} title="No open jobs" description="New job offers will appear here for you to accept." />
            ) : (
                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
                    {offers.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section title="New offers" description="Accept or decline so the customer is not kept waiting.">
                                <ul className="space-y-3">
                                    {offers.map((job) => <li key={job._id}><OfferCard job={job} onAccept={accept} onDecline={decline} pending={pending} /></li>)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}

                    {needsYou.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section title="Needs you" description="Oldest first.">
                                <ul className="space-y-3">
                                    {needsYou.map((job) => <li key={job._id}><JobRow job={job} onAdvance={advance} pending={pending} /></li>)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}

                    {inRepair.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section title="In repair">
                                <ul className="space-y-3">
                                    {inRepair.map((job) => <li key={job._id}><JobRow job={job} onAdvance={advance} pending={pending} /></li>)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}

                    {waiting.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section
                                title="Waiting on customer"
                                actions={<Link to="/dashboard/assigned-jobs" className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline">All jobs <ArrowRight aria-hidden="true" className="size-4" /></Link>}
                            >
                                <ul className="space-y-3">
                                    {waiting.map((job) => <li key={job._id}><JobRow job={job} onAdvance={advance} pending={pending} /></li>)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}
                </Motion.div>
            )}
        </div>
    );
}

export default TechnicianOverview;
