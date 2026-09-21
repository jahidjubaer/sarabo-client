import { useId, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useCustomerFeedbackMutation } from '../../../hooks/useCustomerTechnicianFeedback';
import { customerFeedbackError, feedbackFailureNeedsRefresh, RATING_LABELS, validRating, validateCustomerFeedbackText } from '../../../utils/customerFeedback';
import { notify } from '../../../lib/notify';

export default function ReviewDialog({ requestId, eligible, canSubmit, onClose, returnFocusRef, fallbackFocusRef }) {
    const id = useId();
    const [rating, setRating] = useState(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [commentError, setCommentError] = useState('');
    const [blocked, setBlocked] = useState(false);
    const submitting = useRef(false);
    const mutation = useCustomerFeedbackMutation(requestId, 'review');
    const busy = mutation.isPending;
    const submit = async (event) => {
        event.preventDefault();
        if (submitting.current || blocked || !eligible || !canSubmit) return;
        if (!validRating(rating)) { setError('Choose a rating from 1 to 5.'); return; }
        const validation = validateCustomerFeedbackText(comment, 0, 1000);
        if (validation) { setCommentError(validation); return; }
        submitting.current = true; setError(''); setCommentError('');
        try {
            await mutation.mutateAsync({ rating, comment });
            if (!mutation.isSessionCurrent()) return;
            notify.success('Your review has been submitted.'); onClose();
        } catch (caught) {
            setError(customerFeedbackError(caught, 'review'));
            setBlocked(feedbackFailureNeedsRefresh(caught));
        } finally { submitting.current = false; }
    };
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
            <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto p-4 sm:max-w-lg sm:p-6" showCloseButton={!busy}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    (returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef.current)?.focus();
                }}>
                <form noValidate autoComplete="off" onSubmit={submit} className="space-y-4">
                    <DialogHeader className="pr-6"><DialogTitle>Rate your technician</DialogTitle>
                        <DialogDescription>Share feedback about your completed repair experience.</DialogDescription>
                    </DialogHeader>
                    <fieldset disabled={busy || blocked} aria-invalid={!!error && !validRating(rating)} aria-describedby={`${id}-rating-help ${id}-error`} className="space-y-2">
                        <legend className="mb-2 text-sm font-medium">Rating (required)</legend>
                        <div className="grid grid-cols-5 gap-1.5">
                            {Object.entries(RATING_LABELS).map(([value, label]) => <label key={value} className="min-w-0 cursor-pointer">
                                <input type="radio" name={`${id}-rating`} value={value} checked={rating === Number(value)} required
                                    onChange={() => { setRating(Number(value)); setError(''); }} aria-label={`${value} — ${label}`} className="peer sr-only" />
                                <span className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-ds border border-ds-border text-sm peer-checked:border-ds-primary peer-checked:bg-ds-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ds-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-60">
                                    <Star aria-hidden="true" className={`size-5 ${rating === Number(value) ? 'fill-ds-primary text-ds-primary' : 'text-ds-muted-foreground'}`} />
                                    <span>{value}</span>
                                </span>
                            </label>)}
                        </div>
                        <p id={`${id}-rating-help`} role="status" className="text-sm text-ds-muted-foreground">{validRating(rating) ? `Selected: ${rating} — ${RATING_LABELS[rating]}` : 'Choose 1 (Very poor) to 5 (Excellent).'}</p>
                    </fieldset>
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-comment`}>Comment (optional)</Label>
                        <Textarea id={`${id}-comment`} rows={4} maxLength={1000} value={comment} disabled={busy || blocked}
                            onChange={(event) => { setComment(event.target.value); setCommentError(''); setError(''); }}
                            aria-invalid={!!commentError} aria-describedby={`${id}-comment-help ${id}-comment-error`} />
                        <p id={`${id}-comment-help`} className="text-xs text-ds-muted-foreground">Do not include personal or sensitive information in your review. Plain text only. {comment.length}/1,000 characters.</p>
                        <p id={`${id}-comment-error`} role={commentError ? 'alert' : undefined} className="text-sm text-ds-destructive">{commentError}</p>
                    </div>
                    <p className="rounded-ds border border-ds-border bg-ds-muted/30 p-3 text-sm">Your review is final after submission. It cannot be edited or deleted.</p>
                    {!eligible && !busy && <p role="status" className="text-sm">A new review is no longer available. Close this dialog to view your latest feedback.</p>}
                    {eligible && !canSubmit && !busy && <p role="status" className="text-sm">Wait for feedback to refresh before submitting.</p>}
                    <p id={`${id}-error`} role={error ? 'alert' : undefined} className="text-sm text-ds-destructive">{error}</p>
                    <DialogFooter>
                        <Button variant="outline" disabled={busy} onClick={onClose}>{blocked ? 'Close and review feedback' : 'Cancel'}</Button>
                        <Button type="submit" disabled={busy || blocked || !eligible || !canSubmit || !validRating(rating)} aria-describedby={`${id}-error`}>{busy ? 'Submitting…' : 'Submit review'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
