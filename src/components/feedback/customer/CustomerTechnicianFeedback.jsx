import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { useRepairFeedback } from '../../../hooks/useCustomerTechnicianFeedback';
import { repairFeedbackGeneration } from '../../../hooks/repairFeedbackKeys';
import { feedbackReadState, REPORT_REASONS, REPORT_STATUSES } from '../../../utils/technicianFeedback';
import { hasCustomerFeedback, RATING_LABELS } from '../../../utils/customerFeedback';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { ErrorState } from '../../common/ErrorState';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { buttonVariants } from '../../ui/button-variants';
import ReviewDialog from './ReviewDialog';
import ReportDialog from './ReportDialog';
import { StatusBadge } from '../../common/StatusBadge';

function FeedbackSection({ requestId }) {
    const id = useId();
    const client = useQueryClient();
    const query = useRepairFeedback(requestId);
    const [dialog, setDialog] = useState(null);
    const returnFocus = useRef(null);
    const heading = useRef(null);
    const state = feedbackReadState(query, hasCustomerFeedback(query.data));
    const data = state === 'ready' ? query.data : null;
    const canSubmit = !!data && !query.isFetching && !query.isError && query.fetchStatus !== 'paused';
    const reviewEligible = data?.reviewEligibility.eligible === true && !data.ownReview;
    const refresh = () => client.invalidateQueries({ queryKey: query.queryKey, exact: true });
    const open = (event, next) => { returnFocus.current = event.currentTarget; setDialog(next); };
    return (
        <section aria-labelledby={`${id}-heading`} className="min-w-0 space-y-5 rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6">
            <h2 id={`${id}-heading`} ref={heading} tabIndex={-1} className="focus-ring text-base font-semibold">Feedback about your technician</h2>
            {state === 'loading' && <p role="status" className="text-sm text-ds-muted-foreground">Loading your feedback options…</p>}
            {state === 'unavailable' && <ErrorState headingLevel={3} className="px-4 py-5" title="Feedback unavailable"
                description="We could not check your feedback options. This does not change the state of your repair."
                onRetry={() => client.resetQueries({ queryKey: query.queryKey, exact: true })} />}
            {data && <>
                {(query.isError || query.fetchStatus === 'paused') ? <div role="status" className="space-y-2 rounded-ds border border-ds-border bg-ds-muted/30 p-3 text-sm">
                    <p>Showing previously loaded feedback. New submissions are unavailable until feedback can be refreshed.</p>
                    <Button variant="outline" size="sm" onClick={refresh}>Retry refresh</Button>
                </div> : query.isFetching ? <p role="status" className="text-sm text-ds-muted-foreground">Refreshing feedback…</p> : null}
                <div className="space-y-3" aria-labelledby={`${id}-review`}>
                    <h3 id={`${id}-review`} className="text-sm font-semibold">{data.ownReview ? 'Your review' : 'Review your repair experience'}</h3>
                    {data.ownReview ? <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{data.ownReview.rating} / 5 — {RATING_LABELS[data.ownReview.rating]}</p>
                            {data.ownReview.verifiedRepair === true && <Badge tone="neutral">Verified repair</Badge>}
                        </div>
                        {data.ownReview.comment && <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{data.ownReview.comment}</p>}
                        {data.ownReview.createdAt && <p className="text-xs text-ds-muted-foreground">Submitted <time dateTime={data.ownReview.createdAt}>{formatAbsoluteDateTime(data.ownReview.createdAt)}</time></p>}
                        <p className="text-xs text-ds-muted-foreground">Your review is final and cannot be edited or deleted.</p>
                    </div> : reviewEligible ? <>
                        <p className="text-sm text-ds-muted-foreground">Share feedback about your completed repair experience.</p>
                        <Button disabled={!canSubmit} onClick={(event) => open(event, { kind: 'review' })}>Rate your technician</Button>
                    </> : data.reviewEligibility.code === 'EMAIL_NOT_VERIFIED' ? <>
                        <p className="text-sm text-ds-muted-foreground">Verify your email to submit a review. You can still report an issue below when a technician is eligible.</p>
                        <Link to="/verify-email" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Verify email</Link>
                    </> : <p className="text-sm text-ds-muted-foreground">{data.reviewEligibility.code === 'REVIEW_ALREADY_EXISTS' ? 'A review has already been submitted for this repair.' : 'This repair is not currently eligible for a review. Eligibility is confirmed after device receipt.'}</p>}
                </div>
                <div className="space-y-3 border-t border-ds-border pt-5" aria-labelledby={`${id}-report`}>
                    <h3 id={`${id}-report`} className="text-sm font-semibold">Private issue reporting</h3>
                    <p className="text-sm text-ds-muted-foreground">A report is separate from your review and is sent to Sarabo administrators for review.</p>
                    {data.reportTargets.length > 0 && <Button variant="outline" disabled={!canSubmit} className="h-auto min-h-11 max-w-full whitespace-normal"
                        onClick={(event) => open(event, { kind: 'report', targets: data.reportTargets })}>Report an issue with technician</Button>}
                    {data.reportTargets.length === 0 && <p className="text-sm text-ds-muted-foreground">No technician is currently eligible for a new report on this repair.</p>}
                    <h4 className="pt-2 text-sm font-medium">Your reports</h4>
                    {data.reports.length === 0 ? <p className="text-sm text-ds-muted-foreground">No reports submitted for this repair.</p> : <>
                        <p className="text-xs text-ds-muted-foreground">Resolved means Admin handling is complete. Dismissed means closed without further action. Neither status indicates a refund or a finding against a technician.</p>
                        <ul className="space-y-3">{data.reports.map((report) => <li key={report._id} className="space-y-2 rounded-ds border border-ds-border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{REPORT_REASONS[report.reason] ?? 'Reported issue'}</p>
                                {report.status in REPORT_STATUSES ? <StatusBadge domain="report" status={report.status} audience="customer" /> : <Badge tone="neutral">Status unavailable</Badge>}
                            </div>
                            <dl className="space-y-1 text-xs text-ds-muted-foreground">
                                {report.createdAt && <div className="flex flex-wrap gap-x-1"><dt>Submitted:</dt><dd><time dateTime={report.createdAt}>{formatAbsoluteDateTime(report.createdAt)}</time></dd></div>}
                                {report.updatedAt && report.updatedAt !== report.createdAt && <div className="flex flex-wrap gap-x-1"><dt>Updated:</dt><dd><time dateTime={report.updatedAt}>{formatAbsoluteDateTime(report.updatedAt)}</time></dd></div>}
                                {report.closedAt && <div className="flex flex-wrap gap-x-1"><dt>Closed:</dt><dd><time dateTime={report.closedAt}>{formatAbsoluteDateTime(report.closedAt)}</time></dd></div>}
                            </dl>
                        </li>)}</ul>
                    </>}
                </div>
            </>}
            {dialog?.kind === 'review' && <ReviewDialog requestId={requestId} eligible={reviewEligible} canSubmit={canSubmit}
                onClose={() => setDialog(null)} returnFocusRef={returnFocus} fallbackFocusRef={heading} />}
            {dialog?.kind === 'report' && <ReportDialog requestId={requestId} targets={dialog.targets} availableTargets={data?.reportTargets ?? []} canSubmit={canSubmit}
                onClose={() => setDialog(null)} returnFocusRef={returnFocus} fallbackFocusRef={heading} />}
        </section>
    );
}

export default function CustomerTechnicianFeedback({ requestId }) {
    const { user } = useAuth();
    const { role } = useRole();
    const client = useQueryClient();
    if (!user?.uid || role !== 'user') return null;
    // No account/repair can inherit another account/repair's private draft.
    return <FeedbackSection key={`${user.uid}:${requestId}:${repairFeedbackGeneration(client)}`} requestId={requestId} />;
}
