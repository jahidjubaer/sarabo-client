import { Link } from 'react-router';
import { ArrowRight, CircleCheckBig, ClipboardList, MapPin, UserCheck } from 'lucide-react';
import { ErrorState } from '../common/ErrorState';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { buttonVariants } from '../ui/button-variants';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { cn } from '../../lib/utils';

const DISPLAY_LIMIT = 3;

function SourcePanel({ icon, title, count, children }) {
    const PanelIcon = icon;
    return (
        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ds-foreground">
                    <PanelIcon aria-hidden="true" className="size-4 text-ds-primary" />
                    {title}
                </h3>
                {count !== undefined && <Badge tone={count > 0 ? 'warning' : 'success'}>{count}</Badge>}
            </div>
            {children}
        </div>
    );
}

function RequestItem({ request, featured }) {
    const { device, category } = getProductSummary(request);
    const location = request.senderDistrict || request.serviceLocation?.district;

    return (
        <li className="border-t border-ds-border py-4 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="ds-label text-ds-warning">Assignment required</p>
                    <p className="mt-1 break-words text-sm font-semibold text-ds-foreground">{device}</p>
                    {category && <p className="mt-0.5 text-xs text-ds-muted-foreground">{category}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ds-muted-foreground">
                        {request.trackingId && <span className="break-all font-mono">{request.trackingId}</span>}
                        {location && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="size-3.5" />{location}</span>}
                        {request.createdAt && <span>{formatAbsoluteDateTime(request.createdAt)}</span>}
                    </div>
                </div>
                <Link
                    to={`/dashboard/assign-technicians?request=${request._id}`}
                    className={cn(buttonVariants({ variant: featured ? 'action' : 'outline', size: 'sm' }), 'w-full shrink-0 sm:w-auto')}
                >
                    Assign technician <ArrowRight aria-hidden="true" />
                </Link>
            </div>
        </li>
    );
}

function ApplicationItem({ technician, featured }) {
    return (
        <li className="border-t border-ds-border py-4 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="ds-label text-ds-warning">Application review</p>
                    <p className="mt-1 break-words text-sm font-semibold text-ds-foreground">{technician.name || 'Technician applicant'}</p>
                    <p className="mt-0.5 break-all text-xs text-ds-muted-foreground">{technician.email}</p>
                    {technician.district && <p className="mt-2 inline-flex items-center gap-1 text-xs text-ds-muted-foreground"><MapPin aria-hidden="true" className="size-3.5" />{technician.district}</p>}
                </div>
                <Link
                    to="/dashboard/approve-technicians"
                    className={cn(buttonVariants({ variant: featured ? 'action' : 'outline', size: 'sm' }), 'w-full shrink-0 sm:w-auto')}
                >
                    Review application <ArrowRight aria-hidden="true" />
                </Link>
            </div>
        </li>
    );
}

function PanelLoading() {
    return <div className="space-y-3">{[0, 1].map((key) => <Skeleton key={key} className="h-24 w-full" />)}</div>;
}

function AdminBlockedWork({ requests, technicians, requestsState, techniciansState, onRetryRequests, onRetryTechnicians }) {
    const awaitingAssignments = requestsState.hasUsableData
        ? requests.filter((request) => request.deliveryStatus === 'pending-pickup')
        : [];
    const pendingApplications = techniciansState.hasUsableData
        ? technicians.filter((technician) => technician.status === 'pending')
        : [];
    const allSourcesUsable = requestsState.hasUsableData && techniciansState.hasUsableData;
    const noBlockedWork = allSourcesUsable && awaitingAssignments.length === 0 && pendingApplications.length === 0;

    return (
        <section aria-labelledby="admin-blocked-work-heading" className="space-y-4">
            <div>
                <p className="ds-label text-ds-primary">Operational queue</p>
                <h2 id="admin-blocked-work-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground sm:text-2xl">What needs Admin action?</h2>
                <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">Resolve assignment and application decisions before reviewing supporting workload and analytics.</p>
            </div>

            {noBlockedWork ? (
                <div className="rounded-ds-lg border border-ds-success/30 bg-ds-success/5 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ds-success/10 text-ds-success"><CircleCheckBig aria-hidden="true" className="size-5" /></span>
                        <div>
                            <h3 className="text-base font-semibold text-ds-foreground">No Admin action is waiting</h3>
                            <p className="mt-1 text-sm text-ds-muted-foreground">There are no repair requests awaiting assignment and no Technician applications awaiting review.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    <SourcePanel icon={ClipboardList} title="Requests awaiting assignment" count={requestsState.hasUsableData ? awaitingAssignments.length : undefined}>
                        {requestsState.isInitialLoading ? (
                            <PanelLoading />
                        ) : requestsState.isUnavailableBeforeData ? (
                            <ErrorState title="Assignment queue unavailable" description="We couldn't load requests awaiting assignment right now." onRetry={onRetryRequests} className="px-4 py-8" />
                        ) : awaitingAssignments.length === 0 ? (
                            <p className="text-sm text-ds-muted-foreground">No repair requests are waiting for assignment.</p>
                        ) : (
                            <ul>
                                {awaitingAssignments.slice(0, DISPLAY_LIMIT).map((request, index) => <RequestItem key={request._id} request={request} featured={index === 0} />)}
                            </ul>
                        )}
                    </SourcePanel>

                    <SourcePanel icon={UserCheck} title="Technician applications" count={techniciansState.hasUsableData ? pendingApplications.length : undefined}>
                        {techniciansState.isInitialLoading ? (
                            <PanelLoading />
                        ) : techniciansState.isUnavailableBeforeData ? (
                            <ErrorState title="Application queue unavailable" description="We couldn't load pending Technician applications right now." onRetry={onRetryTechnicians} className="px-4 py-8" />
                        ) : pendingApplications.length === 0 ? (
                            <p className="text-sm text-ds-muted-foreground">No Technician applications are waiting for review.</p>
                        ) : (
                            <ul>
                                {pendingApplications.slice(0, DISPLAY_LIMIT).map((technician, index) => (
                                    <ApplicationItem key={technician._id} technician={technician} featured={awaitingAssignments.length === 0 && index === 0} />
                                ))}
                            </ul>
                        )}
                    </SourcePanel>
                </div>
            )}
        </section>
    );
}

export { AdminBlockedWork };
