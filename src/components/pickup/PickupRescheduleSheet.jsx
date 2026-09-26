import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { pickupSlotKeys } from '../../hooks/usePickupSlots';
import { reschedulePickup } from '../../api/pickupSlots';
import {
    encodePickupChoice, parsePickupChoice, formatPickupSlot, getPickupErrorMessage, STALE_PICKUP_CODES,
} from '../../utils/pickupSlots';
import { notify } from '../../lib/notify';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';
import { PickupSlotPicker } from './PickupSlotPicker';

// Mounted fresh each time the sheet opens, so it starts from the stored slot.
function RescheduleForm({ request, onDone }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const current = request.pickupSlot ? encodePickupChoice(request.pickupSlot.date, request.pickupSlot.slotId) : '';
    const [choice, setChoice] = useState(current);
    const [error, setError] = useState(null);

    const save = useMutation({
        mutationFn: (pickupSlot) => reschedulePickup(axiosSecure, request._id, pickupSlot),
        onSuccess: ({ pickupSlot }) => {
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            queryClient.invalidateQueries({ queryKey: pickupSlotKeys.all });
            notify.success(`Pickup moved to ${formatPickupSlot(pickupSlot)}.`);
            onDone();
        },
        onError: (err) => {
            if (STALE_PICKUP_CODES.includes(err?.response?.data?.code)) {
                queryClient.invalidateQueries({ queryKey: pickupSlotKeys.all });
            }
            setError(getPickupErrorMessage(err) || 'The pickup time could not be changed. Please try again.');
        },
    });

    const submit = (event) => {
        event.preventDefault();
        const parsed = parsePickupChoice(choice);
        if (!parsed) {
            setError('Please choose a pickup time.');
            return;
        }
        if (choice === current) {
            onDone();
            return;
        }
        setError(null);
        save.mutate(parsed);
    };

    return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
                <PickupSlotPicker
                    region={request.serviceLocation?.region}
                    value={choice}
                    onChange={(next) => { setChoice(next); setError(null); }}
                    currentChoice={current}
                    error={error}
                    errorId="reschedule-pickup-error"
                />
            </div>
            <SheetFooter className="border-t border-ds-border">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>Cancel</Button>
                    <LoadingButton type="submit" variant="primary" loading={save.isPending} loadingText="Saving…">Save pickup time</LoadingButton>
                </div>
            </SheetFooter>
        </form>
    );
}

// Side panel where the customer moves their pickup (pickup-scheduling phase).
// The server re-checks ownership, status and capacity.
function PickupRescheduleSheet({ open, onOpenChange, request }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle>{request?.pickupSlot ? 'Change pickup time' : 'Choose a pickup time'}</SheetTitle>
                    <SheetDescription>
                        {request?.pickupSlot ? `Currently ${formatPickupSlot(request.pickupSlot)}.` : 'Pick a 2-hour window for the technician to collect your device.'}
                    </SheetDescription>
                </SheetHeader>
                {open && request && <RescheduleForm request={request} onDone={() => onOpenChange(false)} />}
            </SheetContent>
        </Sheet>
    );
}

export { PickupRescheduleSheet };
