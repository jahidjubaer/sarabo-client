import { useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { useTechnicianReviews } from '../../../hooks/useTechnicianFeedback';
import { technicianReviewGeneration } from '../../../hooks/technicianFeedbackKeys';
import { feedbackReadState, hasTechnicianReviewPage } from '../../../utils/technicianFeedback';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { ErrorState } from '../../common/ErrorState';
import { DataTablePagination } from '../../admin/data-table/DataTablePagination';
import TechnicianReviewSummary, { ReviewStars } from './TechnicianReviewSummary';

export function TechnicianReviewCard({ review }) {
    const commentId = useId();
    const [expanded, setExpanded] = useState(false);
    const comment = typeof review.comment === 'string' ? review.comment : '';
    const longComment = comment.length > 320;
    return (
        <article className="min-w-0 space-y-3 rounded-ds-lg border border-ds-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold">Verified customer</h3>
                    {review.createdAt && <time dateTime={review.createdAt} className="text-xs text-ds-muted-foreground">{formatAbsoluteDateTime(review.createdAt)}</time>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ReviewStars rating={review.rating} />
                    <p className="text-sm" aria-label={`Rating: ${review.rating} out of 5`}>{review.rating} / 5</p>
                </div>
            </div>
            <p id={commentId} className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">
                {comment ? (longComment && !expanded ? `${comment.slice(0, 320)}…` : comment) : 'No comment provided.'}
            </p>
            {longComment && <Button variant="ghost" size="sm" className="min-h-11" aria-expanded={expanded} aria-controls={commentId}
                onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show less' : 'Read full comment'}</Button>}
        </article>
    );
}

function TechnicianReviews() {
    const headingId = useId();
    const [page, setPage] = useState(1);
    const client = useQueryClient();
    const query = useTechnicianReviews(page, 20);
    const state = feedbackReadState(query, hasTechnicianReviewPage(query.data));
    const data = state === 'ready' ? query.data : null;
    const pageCount = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
    const refresh = () => client.invalidateQueries({ queryKey: query.queryKey, exact: true });
    return (
        <Card role="region" aria-labelledby={headingId} className="min-w-0 space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={headingId} className="text-base font-semibold">Customer reviews</h2>
                {data && <Button variant="outline" size="sm" className="min-h-11" disabled={query.isFetching} onClick={refresh}>Refresh reviews</Button>}
            </div>
            {state === 'loading' && <p role="status" className="text-sm text-ds-muted-foreground">Loading your rating and reviews…</p>}
            {state === 'unavailable' && <div role="alert"><ErrorState headingLevel={3} className="px-4 py-5" title="Reviews unavailable"
                description="We could not load your rating and reviews. Your profile is still available."
                onRetry={() => client.resetQueries({ queryKey: query.queryKey, exact: true })} /></div>}
            {data && <>
                {(query.isError || query.fetchStatus === 'paused') ? <p role="status" className="rounded-ds border border-ds-border bg-ds-muted/30 p-3 text-sm">
                    Showing previously loaded reviews. Refresh is unavailable; use Refresh reviews to try again.
                </p> : query.isFetching ? <p role="status" className="text-sm text-ds-muted-foreground">Refreshing reviews…</p> : null}
                <TechnicianReviewSummary averageRating={data.averageRating} reviewCount={data.reviewCount} />
                {data.items.length > 0 && <>
                    <p className="text-xs text-ds-muted-foreground">Newest first · 20 per page</p>
                    <ul className="space-y-3">{data.items.map((review) => <li key={review._id}><TechnicianReviewCard review={review} /></li>)}</ul>
                </>}
                {data.items.length === 0 && data.reviewCount > 0 && <p className="text-sm text-ds-muted-foreground">No reviews on this page. Refresh or return to the first page.</p>}
                {page > pageCount ? <Button variant="outline" className="min-h-11" onClick={() => setPage(1)}>Go to first page</Button>
                    : <nav aria-label="Customer review pagination"><DataTablePagination pageIndex={page - 1} pageCount={pageCount}
                        canPrevious={page > 1 && !query.isFetching} canNext={page < pageCount && !query.isFetching}
                        onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(pageCount, value + 1))} /></nav>}
            </>}
        </Card>
    );
}

export default function TechnicianReviewList({ role }) {
    const { user } = useAuth();
    const client = useQueryClient();
    if (role !== 'rider' || !user?.uid) return null;
    // Reset pagination and local read-more state on account/authorization changes.
    return <TechnicianReviews key={`${user.uid}:${technicianReviewGeneration(client)}`} />;
}
