import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { jobPortalKeys } from '../../hooks/useJobPortal';
import { applyForJob, withdrawApplication } from '../../api/jobPortal';
import { wholeNumberRule } from '../../utils/serviceCatalogueForm';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import { notify } from '../../lib/notify';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { MoneyInput } from '../ui/money-input';
import { FormField } from '../common/FormField';
import { LoadingButton } from '../common/LoadingButton';

const NOTE_MAX = 500;
const MAX_ESTIMATE = 100000;

const ERROR_COPY = {
    JOB_NOT_OPEN: 'This job is no longer open.',
    APPLICATION_CLOSED: 'Your offer for this job is closed - the customer has already decided.',
    INSPECTION_FEE_TOO_HIGH: 'The inspection fee is above the limit for this repair.',
    INVALID_ESTIMATE: 'Please check the estimate.',
    TECHNICIAN_NOT_APPROVED: 'Only approved technicians can apply.',
    NO_PENDING_APPLICATION: 'You have no open application for this job.',
};
const errorMessage = (error, fallback) => ERROR_COPY[error?.response?.data?.code] || fallback;

// Mounted fresh each time the sheet opens.
function ApplicationForm({ job, onDone }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const existing = job.myApplication?.status === 'pending' ? job.myApplication : null;
    // The customer rejected the offer: one revised offer, starting from the old one.
    const revising = job.myApplication?.status === 'declined' && job.myApplication.canReoffer ? job.myApplication : null;
    const start = existing || revising;
    const { register, handleSubmit, setError, formState: { errors } } = useForm({
        defaultValues: {
            estimateMin: start ? String(start.estimateMin) : '',
            estimateMax: start ? String(start.estimateMax) : '',
            inspectionFee: start ? String(start.inspectionFee) : String(job.maxInspectionFee),
            note: start?.note || '',
        },
    });
    const [formError, setFormError] = useState(null);

    const refresh = () => queryClient.invalidateQueries({ queryKey: jobPortalKeys.portal });
    const save = useMutation({
        mutationFn: (payload) => applyForJob(axiosSecure, job.id, payload),
        onSuccess: () => {
            refresh();
            notify.success(existing ? 'Application updated.' : revising ? 'Revised offer sent. The customer will look at it again.' : 'Application sent. The customer will compare it with others.');
            onDone();
        },
        onError: (error) => { refresh(); setFormError(errorMessage(error, 'Your application could not be sent. Please try again.')); },
    });
    const withdraw = useMutation({
        mutationFn: () => withdrawApplication(axiosSecure, job.id),
        onSuccess: () => { refresh(); notify.success('Application withdrawn.'); onDone(); },
        onError: (error) => { refresh(); setFormError(errorMessage(error, 'Your application could not be withdrawn. Please try again.')); },
    });

    const onValid = (values) => {
        const payload = {
            estimateMin: Number(values.estimateMin),
            estimateMax: Number(values.estimateMax),
            inspectionFee: Number(values.inspectionFee),
            note: values.note.trim(),
        };
        if (payload.estimateMin > payload.estimateMax) {
            setError('estimateMax', { message: 'Must be at least the lowest estimate.' });
            return;
        }
        setFormError(null);
        save.mutate(payload);
    };
    const busy = save.isPending || withdraw.isPending;

    return (
        <form onSubmit={handleSubmit(onValid)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6 sm:px-6">
                {revising && (
                    <p className="rounded-ds-lg bg-ds-attention-subtle p-3 text-body-sm text-ds-attention-subtle-foreground">
                        The customer rejected your offer of <span className="ds-numeric font-semibold">{formatMoneyRange(revising.estimateMin, revising.estimateMax, 'BDT')}</span> (fee <span className="ds-numeric font-semibold">{formatMoney(revising.inspectionFee, 'BDT')}</span>). This is your one revised offer - if it is rejected too, you can't send another for this job.
                    </p>
                )}
                <p className="rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">
                    Sarabo's usual price for this repair is <span className="ds-numeric font-semibold text-ds-foreground">{formatMoneyRange(job.catalogueEstimate.min, job.catalogueEstimate.max, job.catalogueEstimate.currency)}</span>.
                    {' '}Estimate from the photos and description; you give the final price after inspecting the device.
                </p>
                <fieldset className="space-y-3">
                    <legend className="text-body-sm font-semibold text-ds-foreground">Your estimate for the repair</legend>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField id="apply-estimate-min" label="From (BDT)" required error={errors.estimateMin?.message}>
                            <MoneyInput id="apply-estimate-min" inputMode="numeric" {...register('estimateMin', wholeNumberRule({ min: 1, max: MAX_ESTIMATE, label: 'Estimate' }))} />
                        </FormField>
                        <FormField id="apply-estimate-max" label="To (BDT)" required error={errors.estimateMax?.message}>
                            <MoneyInput id="apply-estimate-max" inputMode="numeric" {...register('estimateMax', wholeNumberRule({ min: 1, max: MAX_ESTIMATE, label: 'Estimate' }))} />
                        </FormField>
                    </div>
                </fieldset>
                <FormField
                    id="apply-inspection-fee"
                    label="Inspection fee (BDT)"
                    required
                    hint={`What the customer pays for your visit - at most ${formatMoney(job.maxInspectionFee, 'BDT')}. It counts toward the final price if they go ahead.`}
                    error={errors.inspectionFee?.message}
                >
                    <MoneyInput id="apply-inspection-fee" inputMode="numeric" {...register('inspectionFee', wholeNumberRule({ min: 0, max: job.maxInspectionFee, label: 'Inspection fee' }))} />
                </FormField>
                <FormField id="apply-note" label="Note for the customer" hint={`Optional. Up to ${NOTE_MAX} characters.`} error={errors.note?.message}>
                    <Textarea id="apply-note" rows={3} maxLength={NOTE_MAX} placeholder="What you think is wrong, parts you may need…" {...register('note', { maxLength: { value: NOTE_MAX, message: `At most ${NOTE_MAX} characters.` } })} />
                </FormField>
                {formError ? <p role="alert" className="text-body-sm font-medium text-ds-destructive">{formError}</p> : null}
            </div>
            <SheetFooter className="border-t border-ds-border">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    {existing ? (
                        <Button type="button" variant="outline" className="text-ds-destructive hover:text-ds-destructive" onClick={() => withdraw.mutate()} disabled={busy}>
                            Withdraw application
                        </Button>
                    ) : <span />}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onDone} disabled={busy}>Cancel</Button>
                        <LoadingButton type="submit" variant="primary" loading={save.isPending} loadingText="Sending…">
                            {existing ? 'Update application' : revising ? 'Send revised offer' : 'Send application'}
                        </LoadingButton>
                    </div>
                </div>
            </SheetFooter>
        </form>
    );
}

// Side panel where a technician applies for a job (job-portal phase B).
function JobApplicationSheet({ open, onOpenChange, job }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle>{job?.myApplication?.status === 'pending' ? 'Update your application' : job?.myApplication?.status === 'declined' ? 'Send a revised offer' : 'Apply for this job'}</SheetTitle>
                    <SheetDescription>{job ? `${job.title} · ${job.district}` : ''}</SheetDescription>
                </SheetHeader>
                {open && job && <ApplicationForm job={job} onDone={() => onOpenChange(false)} />}
            </SheetContent>
        </Sheet>
    );
}

export { JobApplicationSheet };
