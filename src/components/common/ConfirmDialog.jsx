import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LoadingButton } from './LoadingButton';

// The confirmation dialog (Radix focus trap, Escape, focus return). Replaces
// SweetAlert confirmations. Supports an optional reason textarea with a
// caller-supplied validator - the caller keeps ownership of the API payload.
//
//   confirmVariant  'primary' (default) | 'action' | 'destructive'
//                   `destructive` (boolean) is kept as a shorthand.
//   summary         optional node shown between the description and the
//                   buttons, e.g. the amount being approved.
//   reasonMaxLength shows a live character count when set.
//
// While `busy` the dialog cannot be dismissed (Escape, overlay click and the
// close button are all ignored), so a request in flight is never orphaned.
function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    summary,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant,
    destructive = false,
    busy = false,
    busyLabel = 'Working…',
    onConfirm,
    reason = false,
    reasonLabel = 'Reason',
    reasonPlaceholder = '',
    reasonMaxLength,
    validateReason,
}) {
    const id = useId();
    const [value, setValue] = useState('');
    const [error, setError] = useState(null);
    const reasonId = `${id}-reason`;
    const errorId = `${id}-error`;
    const countId = `${id}-count`;
    const variant = confirmVariant || (destructive ? 'destructive' : 'primary');

    const handleOpenChange = (next) => {
        if (!next && busy) return;
        if (!next) {
            setValue('');
            setError(null);
        }
        onOpenChange(next);
    };

    const handleConfirm = () => {
        if (reason) {
            const check = validateReason ? validateReason(value) : { valid: true };
            if (!check.valid) {
                setError(check.message);
                return;
            }
            onConfirm(value.trim());
        } else {
            onConfirm();
        }
    };

    const describedBy = [error ? errorId : null, reasonMaxLength ? countId : null].filter(Boolean).join(' ') || undefined;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={!busy}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {summary ? <div className="rounded-ds-lg bg-ds-muted px-4 py-3">{summary}</div> : null}
                {reason && (
                    <div className="space-y-1.5">
                        <Label htmlFor={reasonId}>{reasonLabel}</Label>
                        <Textarea
                            id={reasonId}
                            rows={3}
                            value={value}
                            maxLength={reasonMaxLength}
                            disabled={busy}
                            onChange={(event) => { setValue(event.target.value); if (error) setError(null); }}
                            placeholder={reasonPlaceholder}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={describedBy}
                        />
                        <div className="flex items-start justify-between gap-3">
                            {error ? <p id={errorId} role="alert" className="text-body-sm font-medium text-ds-destructive">{error}</p> : <span />}
                            {reasonMaxLength ? (
                                <p id={countId} className="ds-numeric shrink-0 text-micro text-ds-muted-foreground">{value.length} / {reasonMaxLength}</p>
                            ) : null}
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>{cancelLabel}</Button>
                    <LoadingButton variant={variant} onClick={handleConfirm} loading={busy} loadingText={busyLabel}>
                        {confirmLabel}
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { ConfirmDialog };
