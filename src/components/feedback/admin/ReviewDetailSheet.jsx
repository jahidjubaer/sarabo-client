import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { useFeedbackMutation } from '../../../hooks/useTechnicianFeedback';
import { FeedbackBadge, FeedbackDate, FeedbackReference, TechnicianName } from './FeedbackPrimitives';
import ModerationDialog from './ModerationDialog';
import { notify } from '../../../lib/notify';

export default function ReviewDetailSheet({ review, canModerate, onClose, returnFocusRef, fallbackFocusRef }) {
    const mutation = useFeedbackMutation('visibility');
    const [action, setAction] = useState(null);
    const actionFocus = useRef(null);
    return (
        <Sheet open onOpenChange={(open) => { if (!open && !mutation.isPending && !action) onClose(); }}>
            <SheetContent className="w-full max-w-full sm:max-w-xl" showCloseButton={!mutation.isPending && !action}
                onCloseAutoFocus={(event) => { event.preventDefault(); (returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef.current)?.focus(); }}>
                <SheetHeader className="border-b border-ds-border pr-12"><SheetTitle>Technician review</SheetTitle>
                    <SheetDescription>Moderate visibility only. Customer rating and comment cannot be edited.</SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                    {!review ? <p role="status" className="text-sm">This review is no longer in the current page or filter. Close this panel and refresh the list to inspect its latest state.</p> : <>
                        <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">Rating: {review.rating} / 5</p><FeedbackBadge value={review.visibility} /></div>
                        <section className="space-y-2"><h3 className="font-semibold">Customer comment</h3>
                            <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{review.comment || 'No comment provided.'}</p>
                        </section>
                        <dl className="grid gap-4 rounded-ds-lg border border-ds-border bg-ds-card p-4 text-sm sm:grid-cols-2">
                            <div className="min-w-0 sm:col-span-2"><dt className="mb-1 font-medium">Technician</dt><dd><TechnicianName id={review.technicianId} /></dd></div>
                            <div className="min-w-0"><dt className="mb-1 font-medium">Review reference</dt><dd><FeedbackReference value={review._id} /></dd></div>
                            <div className="min-w-0"><dt className="mb-1 font-medium">Technician reference</dt><dd><FeedbackReference value={review.technicianId} /></dd></div>
                            <div><dt className="mb-1 font-medium">Created</dt><dd><FeedbackDate value={review.createdAt} /></dd></div>
                            <div><dt className="mb-1 font-medium">Updated</dt><dd><FeedbackDate value={review.updatedAt} /></dd></div>
                            <div><dt className="mb-1 font-medium">Version</dt><dd>{review.version}</dd></div>
                        </dl>
                        <Button variant="outline" disabled={!canModerate || mutation.isPending} onClick={(event) => {
                            actionFocus.current = event.currentTarget;
                            setAction({ id: review._id, expectedVersion: review.version, visibility: review.visibility === 'visible' ? 'hidden' : 'visible' });
                        }}>{review.visibility === 'visible' ? 'Hide review' : 'Restore review'}</Button>
                        {!canModerate && <p role="status" className="text-sm text-ds-muted-foreground">Wait for the list to refresh before moderating this review.</p>}
                        <section className="space-y-3"><h3 className="font-semibold">Moderation history</h3>
                            {review.moderationHistory?.length ? <ol className="space-y-3">{review.moderationHistory.map((entry, index) => <li key={index} className="space-y-2 rounded-ds-lg border border-ds-border p-3">
                                <FeedbackBadge value={entry.visibility} />
                                <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{entry.reason}</p>
                                <p className="text-xs">Admin: <FeedbackReference value={entry.adminId} /></p><FeedbackDate value={entry.createdAt} />
                            </li>)}</ol> : <p className="text-sm text-ds-muted-foreground">No moderation changes yet.</p>}
                        </section>
                    </>}
                </div>
                {action && <ModerationDialog title={action.visibility === 'hidden' ? 'Hide review' : 'Restore review'}
                    description={action.visibility === 'hidden'
                        ? 'Hiding removes this review from the technician-visible list and rating aggregation. The review content is not deleted.'
                        : 'Restoring returns this review to the technician-visible list and rating aggregation. The original content stays unchanged.'}
                    textLabel="Moderation reason" requireText returnFocusRef={actionFocus} fallbackFocusRef={fallbackFocusRef} onClose={() => setAction(null)}
                    onConfirm={async (reason) => {
                        await mutation.mutateAsync({ ...action, reason });
                        notify.success(action.visibility === 'hidden' ? 'Review hidden.' : 'Review restored.');
                        onClose();
                    }} />}
            </SheetContent>
        </Sheet>
    );
}
