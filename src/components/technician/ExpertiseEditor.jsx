import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { technicianKeys } from '../../hooks/technicianKeys';
import { useExpertiseSelections } from '../../hooks/useExpertiseSelections';
import { buildExpertiseFromSelections, selectionsFromExpertise, validateExpertiseSelections, MAX_EXPERIENCE_YEARS } from '../../utils/technicianExpertiseForm';
import { notify } from '../../lib/notify';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { LoadingButton } from '../common/LoadingButton';
import { ExpertisePicker } from './ExpertisePicker';

const SAVE_ERROR_COPY = {
    TECHNICIAN_HAS_ACTIVE_ASSIGNMENT: 'You can change your expertise once your current repair is finished.',
    EXPERTISE_UPDATE_CONFLICT: 'Your profile was changed somewhere else. Close this and try again.',
    FORBIDDEN: 'You can only change your own expertise.',
};

function saveErrorMessage(error) {
    const code = error?.response?.data?.code;
    if (SAVE_ERROR_COPY[code]) return SAVE_ERROR_COPY[code];
    if (error?.response?.status === 400) return 'Some of these choices were not accepted. Please review them.';
    return 'Your expertise could not be saved. Please try again.';
}

// The form inside the sheet. Mounted fresh each time the sheet opens, so it
// always starts from the stored expertise.
function ExpertiseForm({ technicianId, expertise, onDone }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const { selections, toggleProduct, toggleRepair, setYears } = useExpertiseSelections(selectionsFromExpertise(expertise));
    const [formError, setFormError] = useState(null);

    // PATCH /technicians/:id/expertise - the existing endpoint; the server
    // re-validates everything and refuses while a repair is active.
    const save = useMutation({
        mutationFn: async (payload) => (await axiosSecure.patch(`/technicians/${technicianId}/expertise`, payload)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: technicianKeys.me() });
            notify.success('Expertise saved. You can now be matched to these repairs.');
            onDone();
        },
        onError: (error) => setFormError(saveErrorMessage(error)),
    });

    const submit = (event) => {
        event.preventDefault();
        const check = validateExpertiseSelections(selections);
        if (!check.valid) {
            setFormError(check.message);
            return;
        }
        setFormError(null);
        save.mutate({ expertise: buildExpertiseFromSelections(selections) });
    };

    return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <p id="profile-expertise-help" className="px-5 pb-4 text-body-sm text-ds-muted-foreground sm:px-6">
                    Tick the products you repair, the repairs you handle for each, and your whole years of experience (0 to {MAX_EXPERIENCE_YEARS}).
                </p>
                <ExpertisePicker
                    selections={selections}
                    onToggleProduct={toggleProduct}
                    onToggleRepair={toggleRepair}
                    onYears={setYears}
                    error={formError}
                    errorId="profile-expertise-error"
                />
            </div>
            <SheetFooter className="border-t border-ds-border">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>Cancel</Button>
                    <LoadingButton type="submit" variant="primary" loading={save.isPending} loadingText="Saving…">Save expertise</LoadingButton>
                </div>
            </SheetFooter>
        </form>
    );
}

// Side panel where a technician edits their own expertise (quick-wins phase).
function ExpertiseEditor({ open, onOpenChange, technicianId, expertise }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle>Edit your expertise</SheetTitle>
                    <SheetDescription>These decide which repairs you can be matched to.</SheetDescription>
                </SheetHeader>
                {open && <ExpertiseForm technicianId={technicianId} expertise={expertise} onDone={() => onOpenChange(false)} />}
            </SheetContent>
        </Sheet>
    );
}

export { ExpertiseEditor };
