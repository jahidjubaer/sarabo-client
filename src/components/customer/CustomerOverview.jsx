import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { motion as Motion } from 'motion/react';
import { ArrowRight, CreditCard, FileText, PackageCheck, Plus } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import { PageHeader } from '../common/PageHeader';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { StatusBadge } from '../common/StatusBadge';
import { Section } from '../common/Section';
import { Card } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import ServiceSpine from '../spine/ServiceSpine';
import CategoryImage from '../public/CategoryImage';
import {
    getAgreedPrice, getProductSummary, getRequestAction, getRequestGroup, summarizeRequests,
} from '../../utils/customerRequestPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { deriveProductCategories, normalizeServiceDefinitions } from '../../utils/serviceDefinitionCatalog';
import { getCategoryRequestRoute } from '../../utils/publicContent';
import { formatMoney } from '../../utils/currency';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { staggerContainer, staggerItem } from '../../theme/motion';
import { cn } from '../../lib/utils';

const byNewest = (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
const byOldest = (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
const detailPath = (request) => `/dashboard/my-requests/${request._id}`;

// What each kind of customer to-do looks like in the "Needs you" list.
function needsYouCopy(request, action) {
    const quoteTotal = Number.isFinite(Number(request?.quote?.totalAmount))
        ? formatMoney(request.quote.totalAmount, request.quote.currency)
        : null;
    if (action.kind === 'quote-review') {
        return { Icon: FileText, text: quoteTotal ? `Your quote is ready: ${quoteTotal}` : 'Your quote is ready to review' };
    }
    if (action.kind === 'payment') {
        const due = getAgreedPrice(request);
        return { Icon: CreditCard, text: due ? `Pay ${due} to start the repair` : 'Pay to start the repair' };
    }
    return { Icon: PackageCheck, text: 'Repair complete. Confirm once you have your device back.' };
}

function NeedsYouRow({ request, primary }) {
    const action = getRequestAction(request);
    const { device } = getProductSummary(request);
    const { Icon, text } = needsYouCopy(request, action);
    return (
        <li>
            <Card className="flex flex-col gap-4 border-l-4 border-l-ds-action p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-ds-attention-subtle text-ds-attention-subtle-foreground sm:flex">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-subhead text-ds-foreground">{device}</h3>
                        {request.trackingId && <span className="ds-numeric text-micro text-ds-muted-foreground">{request.trackingId}</span>}
                    </div>
                    <p className="mt-0.5 text-body-sm text-ds-muted-foreground">{text}</p>
                </div>
                <Link
                    to={action.to}
                    className={cn(buttonVariants({ variant: primary ? 'action' : 'outline' }), 'w-full shrink-0 sm:w-auto')}
                >
                    {action.label}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Card>
        </li>
    );
}

function InProgressCard({ request }) {
    const { device, category } = getProductSummary(request);
    return (
        <li>
            <Link to={detailPath(request)} className="focus-ring group flex h-full flex-col gap-5 rounded-ds-lg border border-ds-border bg-ds-card p-5 transition-[border-color,box-shadow] hover:border-ds-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-subhead text-ds-foreground">{device}</h3>
                        {category && <p className="text-body-sm text-ds-muted-foreground">{category}</p>}
                    </div>
                    <StatusBadge status={request.deliveryStatus} audience="customer" showIcon={false} className="shrink-0" />
                </div>
                <ServiceSpine request={request} />
                <p className="flex items-center justify-between gap-3 text-body-sm text-ds-muted-foreground">
                    <span className="line-clamp-2">{getStatusPresentation(request.deliveryStatus).customerDescription}</span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-ds-primary transition-transform motion-safe:group-hover:translate-x-0.5" />
                </p>
            </Link>
        </li>
    );
}

function PastList({ requests }) {
    return (
        <Card className="overflow-hidden">
            <ul className="divide-y divide-ds-border">
                {requests.map((request) => {
                    const { device } = getProductSummary(request);
                    const price = getAgreedPrice(request);
                    return (
                        <li key={request._id}>
                            <Link to={detailPath(request)} className="focus-ring flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-ds-muted/50 sm:flex-nowrap">
                                <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ds-foreground">{device}</span>
                                <span className="text-micro text-ds-muted-foreground sm:w-40">{formatAbsoluteDateTime(request.createdAt)}</span>
                                <StatusBadge status={request.deliveryStatus} audience="customer" showIcon={false} />
                                <span className="ds-numeric w-24 text-right text-body-sm text-ds-foreground">{price || '—'}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}

// First visit: no requests yet. Lead with the devices, not an empty box.
function FirstRequest() {
    const { data } = useServiceDefinitions();
    const categories = deriveProductCategories(normalizeServiceDefinitions(data));
    return (
        <Section title="What needs repairing?" description="Pick your device to start your first request.">
            {categories.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {categories.map((category) => (
                        <li key={category.slug}>
                            <Link to={getCategoryRequestRoute(category.slug)} className="focus-ring group flex h-full flex-col overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card transition-[border-color,box-shadow] hover:border-ds-primary/40 hover:shadow-md">
                                <CategoryImage slug={category.slug} className="aspect-[4/3] w-full" />
                                <span className="p-3 text-body-sm font-semibold text-ds-foreground">{category.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'action', size: 'lg' })}>
                    <Plus aria-hidden="true" /> Request a repair
                </Link>
            )}
        </Section>
    );
}

// Customer home (Phase 3): built around what the customer has to do.
//
//   Needs you     every request waiting on the customer (not just the newest),
//                 oldest first, each with its action inline
//   In progress   repairs moving without them, each with the stage tracker
//   Past repairs  a compact list of finished and cancelled requests
//
// Reuses the existing ['my-requests'] query (shared cache with My Requests) -
// no new endpoints, no invented numbers.
function CustomerOverview() {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const requestsQueryKey = ['my-requests', user?.email];

    const { data: requestsData, isPending, isPaused, isError } = useQuery({
        queryKey: requestsQueryKey,
        queryFn: async () => (await axiosSecure.get('/repair-requests')).data,
    });
    const hasUsableRequests = Array.isArray(requestsData);
    const requests = hasUsableRequests ? requestsData : [];
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableRequests;
    const retryRequests = () => queryClient.resetQueries({ queryKey: requestsQueryKey });

    const newRequestAction = (
        <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'primary' })}>
            <Plus aria-hidden="true" /> New request
        </Link>
    );

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Your repairs" actions={newRequestAction} />
                <CardSkeleton className="h-28" />
                <CardSkeleton className="h-48" />
            </div>
        );
    }

    if (isError || isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Your repairs" actions={newRequestAction} />
                <ErrorState title="Couldn't load your repairs" description="We couldn't load your repair activity right now. Please try again." onRetry={retryRequests} />
            </div>
        );
    }

    const summary = summarizeRequests(requests);
    const needsYou = requests.filter((request) => getRequestGroup(request) === 'needs-action' && getRequestAction(request)).sort(byOldest);
    const inProgress = requests.filter((request) => getRequestGroup(request) === 'active').sort(byNewest);
    const past = requests.filter((request) => ['completed', 'closed'].includes(getRequestGroup(request))).sort(byNewest).slice(0, 5);
    const firstName = (user?.displayName || '').trim().split(/\s+/)[0];

    const description = summary.total === 0
        ? 'Your repair requests will appear here.'
        : [needsYou.length ? `${needsYou.length} need${needsYou.length === 1 ? 's' : ''} you` : null, inProgress.length ? `${inProgress.length} in progress` : null]
            .filter(Boolean).join(' · ') || 'Nothing needs you right now.';

    return (
        <div className="space-y-8">
            <PageHeader title={firstName ? `Hello, ${firstName}` : 'Your repairs'} description={description} actions={newRequestAction} />

            {summary.total === 0 ? (
                <FirstRequest />
            ) : (
                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
                    {needsYou.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section title="Needs you">
                                <ul className="space-y-3">
                                    {needsYou.map((request, index) => <NeedsYouRow key={request._id} request={request} primary={index === 0} />)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}

                    {inProgress.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section title="In progress">
                                <ul className="grid gap-4 lg:grid-cols-2">
                                    {inProgress.map((request) => <InProgressCard key={request._id} request={request} />)}
                                </ul>
                            </Section>
                        </Motion.div>
                    )}

                    {past.length > 0 && (
                        <Motion.div variants={staggerItem}>
                            <Section
                                title="Past repairs"
                                actions={<Link to="/dashboard/my-requests" className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-ds text-body-sm font-semibold text-ds-primary hover:underline">View all <ArrowRight aria-hidden="true" className="size-4" /></Link>}
                            >
                                <PastList requests={past} />
                            </Section>
                        </Motion.div>
                    )}
                </Motion.div>
            )}
        </div>
    );
}

export default CustomerOverview;
