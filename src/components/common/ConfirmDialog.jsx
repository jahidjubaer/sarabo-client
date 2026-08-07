import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

// Business-neutral confirmation dialog on the shared Dialog primitive (Phase
// 7.6A). Real Radix focus-trap/Escape. Supports an optional reason textarea
// (with a caller-supplied validator) for decisions that need one - the caller
// keeps ownership of the API payload and validation semantics.
function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    busy = false,
    onConfirm,
    reason = false,
    reasonLabel = 'Reason',
    reasonPlaceholder = '',
    validateReason,
}) {
    const [value, setValue] = useState('');
    const [error, setError] = useState(null);

    const handleOpenChange = (next) => {
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {reason && (
                    <div className="space-y-1.5">
                        <Label htmlFor="confirm-reason">{reasonLabel}</Label>
                        <Textarea
                            id="confirm-reason"
                            rows={3}
                            value={value}
                            onChange={(event) => { setValue(event.target.value); if (error) setError(null); }}
                            placeholder={reasonPlaceholder}
                            aria-invalid={error ? 'true' : 'false'}
                        />
                        {error && <p role="alert" className="text-xs font-medium text-ds-destructive">{error}</p>}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>{cancelLabel}</Button>
                    <Button variant={destructive ? 'destructive' : 'default'} onClick={handleConfirm} disabled={busy} aria-busy={busy || undefined}>
                        {busy ? 'Working…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { ConfirmDialog };
