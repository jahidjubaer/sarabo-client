import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { LoadingButton } from '../common/LoadingButton';

const NOTE_MIN = 10;
const NOTE_MAX = 500;

// Asked when the technician collects the device: its condition, written with
// the customer present, so a later "you scratched it" has a record (server:
// PATCH /repair-requests/:id/status with pickupCondition). The customer sees
// it on their request and can say it is wrong.
function PickupConditionDialog({ open, onOpenChange, busy, onConfirm }) {
    const id = useId();
    const [note, setNote] = useState('');
    const [accessories, setAccessories] = useState('');
    const tooShort = note.trim().length < NOTE_MIN;
    const close = (next) => {
        if (busy) return;
        if (!next) { setNote(''); setAccessories(''); }
        onOpenChange(next);
    };
    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-md" showCloseButton={!busy}>
                <DialogHeader>
                    <DialogTitle>Record the device's condition</DialogTitle>
                    <DialogDescription>
                        Check the device with the customer and write down what you see: scratches, cracks, dents, whether it turns on.
                        The customer sees this on their request.
                    </DialogDescription>
                </DialogHeader>
                <form id={`${id}-form`} className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!tooShort) onConfirm({ note: note.trim(), accessories: accessories.trim() }); }}>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-note`} className="text-body-sm font-semibold">Condition</label>
                        <Textarea id={`${id}-note`} rows={3} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy}
                            placeholder="For example: turns on; screen cracked top left; small scratch on the back." aria-describedby={`${id}-hint`} />
                        <p id={`${id}-hint`} className="text-micro text-ds-muted-foreground">At least {NOTE_MIN} characters.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-acc`} className="text-body-sm font-semibold">Accessories taken (optional)</label>
                        <Input id={`${id}-acc`} maxLength={200} value={accessories} onChange={(e) => setAccessories(e.target.value)} disabled={busy} placeholder="For example: charger, case" />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => close(false)} disabled={busy}>Cancel</Button>
                    <LoadingButton type="submit" form={`${id}-form`} loading={busy} loadingText="Saving…" disabled={tooShort}>Device collected</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { PickupConditionDialog };
