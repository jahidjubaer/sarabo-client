import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { feedbackMutationError, validateModerationText } from '../../../utils/technicianFeedback';

// Mounted anew for each action. The caller captures expectedVersion when the
// action opens; a background refresh never silently changes that version.
export default function ModerationDialog({ title, description, textLabel, requireText, onConfirm, onClose, returnFocusRef, fallbackFocusRef }) {
    const id = useId();
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        if (pending || failed) return;
        const validation = requireText ? validateModerationText(text) : '';
        if (validation) { setError(validation); return; }
        setPending(true);
        setError('');
        try { await onConfirm(text.trim()); onClose(); }
        catch (caught) { setError(feedbackMutationError(caught)); setFailed(true); }
        finally { setPending(false); }
    };
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
            <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={!pending}
                onCloseAutoFocus={(event) => {
                    const target = returnFocusRef?.current?.isConnected ? returnFocusRef.current : fallbackFocusRef?.current;
                    if (target?.isConnected) { event.preventDefault(); target.focus(); }
                }}>
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
                    {requireText && <div className="space-y-2">
                        <Label htmlFor={id}>{textLabel}</Label>
                        <Textarea id={id} value={text} onChange={(event) => { setText(event.target.value); if (!failed) setError(''); }} maxLength={1000} rows={5}
                            required disabled={pending || failed} aria-invalid={!!error} aria-describedby={`${id}-help ${id}-error`} />
                        <p id={`${id}-help`} className="text-xs text-ds-muted-foreground">Plain text, up to 1,000 characters. {text.length}/1,000</p>
                    </div>}
                    <p id={`${id}-error`} role={error ? 'alert' : undefined} className="text-sm text-ds-destructive">{error}</p>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>{failed ? 'Close and review latest' : 'Cancel'}</Button>
                        <Button type="submit" disabled={pending || failed}>{pending ? 'Saving…' : title}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
