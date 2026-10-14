import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, ShieldCheck, X } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { getWarranty, uploadClaimPhoto, openClaim, confirmFix, requestReview } from '../../api/warranty';
import { notify } from '../../lib/notify';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { checkAiPhoto } from '../../utils/aiPhoto';
import {
    CLAIM_KINDS, CANNOT_CLAIM_COPY, DESCRIPTION_MIN, DESCRIPTION_MAX, NOTE_MAX, WARRANTY_DAYS, warrantyErrorMessage,
} from '../../utils/warranty';
import { Button } from '../ui/button';
import { ChoiceCard } from '../ui/choice-card';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LoadingButton } from '../common/LoadingButton';
import { ErrorState } from '../common/ErrorState';
import { WarrantyClaimCard } from './WarrantyClaimCard';

const warrantyKey = (requestId) => ['warranty', requestId];

const optionalNote = (value) => (value.length > NOTE_MAX ? { valid: false, message: `Keep it under ${NOTE_MAX} characters.` } : { valid: true });

// The form for a new claim: what went wrong, a description, and up to four
// optional photos. Photos upload first; if storage is down the customer can
// still send the claim without them.
function ClaimDialog({ open, onOpenChange, requestId, maxPhotos }) {
    const id = useId();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [kind, setKind] = useState('same_fault');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState(null);
    const tooShort = description.trim().length < DESCRIPTION_MIN;

    const reset = () => { setKind('same_fault'); setDescription(''); setPhotos([]); setError(null); };
    const submit = useMutation({
        mutationFn: async () => {
            const photoIds = [];
            for (const file of photos) photoIds.push(await uploadClaimPhoto(axiosSecure, requestId, file));
            return openClaim(axiosSecure, requestId, { kind, description: description.trim(), photoIds });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: warrantyKey(requestId) });
            notify.success('Warranty claim sent. Your technician will book a free re-inspection.');
            reset();
            onOpenChange(false);
        },
        onError: (err) => setError(warrantyErrorMessage(err, "The claim couldn't be sent. Please try again.")),
    });

    const addPhotos = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        const problem = files.map(checkAiPhoto).find(Boolean);
        if (problem) return setError(problem);
        setError(null);
        setPhotos((current) => [...current, ...files].slice(0, maxPhotos));
    };

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!submit.isPending) { if (!next) reset(); onOpenChange(next); } }}>
            <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton={!submit.isPending}>
                <DialogHeader>
                    <DialogTitle>Report a problem under warranty</DialogTitle>
                    <DialogDescription>
                        Covered: the repaired fault coming back, or a part the technician fitted failing. Not covered: new damage, water damage or a drop.
                        Your technician re-inspects it for free.
                    </DialogDescription>
                </DialogHeader>
                <form id={`${id}-form`} className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!tooShort) submit.mutate(); }}>
                    <fieldset className="space-y-2">
                        <legend className="mb-1 text-body-sm font-semibold text-ds-foreground">What happened?</legend>
                        {CLAIM_KINDS.map((option) => (
                            <ChoiceCard key={option.value} name={`${id}-kind`} value={option.value} label={option.label} description={option.description}
                                checked={kind === option.value} onChange={() => setKind(option.value)} disabled={submit.isPending}
                                className="[&_.text-subhead]:text-body-sm [&>span]:p-3" />
                        ))}
                    </fieldset>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-description`} className="text-body-sm font-semibold text-ds-foreground">Describe the problem</label>
                        <Textarea id={`${id}-description`} value={description} onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                            rows={4} placeholder="For example: the screen started flickering again two days ago, the same as before the repair."
                            aria-describedby={`${id}-description-hint`} disabled={submit.isPending} />
                        <p id={`${id}-description-hint`} className="text-micro text-ds-muted-foreground">
                            At least {DESCRIPTION_MIN} characters ({description.trim().length}/{DESCRIPTION_MAX}).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-body-sm font-semibold text-ds-foreground">Photos (optional, up to {maxPhotos})</p>
                        {photos.length > 0 && (
                            <ul className="space-y-1">
                                {photos.map((file, index) => (
                                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-ds border border-ds-border px-3 py-1.5 text-body-sm">
                                        <span className="truncate">{file.name}</span>
                                        <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${file.name}`} disabled={submit.isPending}
                                            onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}><X aria-hidden="true" /></Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {photos.length < maxPhotos && (
                            <label className="focus-within:ring-2 focus-within:ring-ds-ring inline-flex cursor-pointer items-center gap-2 rounded-ds border border-ds-border px-3 py-2 text-body-sm">
                                <ImagePlus aria-hidden="true" className="size-4" /> Add photos
                                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addPhotos} disabled={submit.isPending} />
                            </label>
                        )}
                    </div>
                    {error && <p role="alert" className="text-body-sm text-ds-destructive">{error}</p>}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={submit.isPending}>Cancel</Button>
                    <LoadingButton type="submit" form={`${id}-form`} loading={submit.isPending} loadingText={photos.length ? 'Uploading…' : 'Sending…'} disabled={tooShort}>
                        Send claim
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// The warranty part of the customer's repair page: how long the repair is
// covered, a way to open a claim, and every claim with the customer's next step.
function CustomerWarrantySection({ requestId }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: warrantyKey(requestId), queryFn: () => getWarranty(axiosSecure, requestId) });
    const [claimOpen, setClaimOpen] = useState(false);
    const [confirming, setConfirming] = useState(null); // { claim, fixed }
    const [reviewing, setReviewing] = useState(null);
    const refresh = () => queryClient.invalidateQueries({ queryKey: warrantyKey(requestId) });

    const confirm = useMutation({
        mutationFn: ({ claim, fixed, note }) => confirmFix(axiosSecure, claim.id, { fixed, note }),
        onSuccess: (_, { fixed }) => {
            setConfirming(null);
            refresh();
            notify.success(fixed ? 'Thanks - the claim is closed.' : 'Thanks. An admin will refund the repair amount.');
        },
        onError: (err) => { setConfirming(null); refresh(); notify.error(warrantyErrorMessage(err, "Your answer couldn't be saved.")); },
    });
    const review = useMutation({
        mutationFn: ({ claim, note }) => requestReview(axiosSecure, claim.id, { note }),
        onSuccess: () => { setReviewing(null); refresh(); notify.success('An admin will review the decision.'); },
        onError: (err) => { setReviewing(null); refresh(); notify.error(warrantyErrorMessage(err, "The review couldn't be requested.")); },
    });

    if (query.isPending) return <Skeleton className="h-24 w-full" />;
    if (query.isError) return <ErrorState headingLevel={3} title="Warranty unavailable" description="We couldn't load the warranty for this repair." onRetry={() => query.refetch()} />;

    const { warranty, canClaim, cannotClaimReason, claims, maxPhotos } = query.data;
    const showReason = !canClaim && cannotClaimReason && !(cannotClaimReason === 'CLAIM_ALREADY_OPEN');

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="flex items-start gap-2 text-body-sm text-ds-foreground">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-success" />
                    <span>
                        {warranty
                            ? <>This repair is covered for {WARRANTY_DAYS} days, until <time dateTime={warranty.endsAt}>{formatAbsoluteDateTime(warranty.endsAt)}</time>, if the same fault comes back or a replaced part fails.</>
                            : CANNOT_CLAIM_COPY.WARRANTY_NOT_STARTED}
                    </span>
                </p>
                {canClaim && <Button variant="outline" onClick={() => setClaimOpen(true)}>Report a problem</Button>}
            </div>
            {showReason && warranty && <p className="text-body-sm text-ds-muted-foreground">{CANNOT_CLAIM_COPY[cannotClaimReason]}</p>}

            {claims.map((claim) => (
                <WarrantyClaimCard key={claim.id} claim={claim} audience="customer">
                    {claim.status === 'fixed_pending_confirmation' && <>
                        <Button variant="action" onClick={() => setConfirming({ claim, fixed: true })}>It works now</Button>
                        <Button variant="outline" onClick={() => setConfirming({ claim, fixed: false })}>Still not working</Button>
                    </>}
                    {claim.canRequestReview && <Button variant="outline" onClick={() => setReviewing(claim)}>Ask an admin to review</Button>}
                </WarrantyClaimCard>
            ))}

            <ClaimDialog open={claimOpen} onOpenChange={setClaimOpen} requestId={requestId} maxPhotos={maxPhotos || 4} />
            <ConfirmDialog
                open={Boolean(confirming)}
                onOpenChange={(open) => { if (!open) setConfirming(null); }}
                title={confirming?.fixed ? 'Is your device working now?' : 'Still not working?'}
                description={confirming?.fixed
                    ? 'This closes the warranty claim.'
                    : 'An admin will refund the repair amount, since the fault could not be fixed under warranty.'}
                reason reasonLabel="Anything to add? (optional)" reasonMaxLength={NOTE_MAX} validateReason={optionalNote}
                confirmLabel={confirming?.fixed ? 'Yes, it works' : 'Still not working'}
                busy={confirm.isPending}
                onConfirm={(note) => confirm.mutate({ ...confirming, note })}
            />
            <ConfirmDialog
                open={Boolean(reviewing)}
                onOpenChange={(open) => { if (!open) setReviewing(null); }}
                title="Ask an admin to review?"
                description="An admin will look at your claim, the photos and the technician's explanation, and decide whether it is covered."
                reason reasonLabel="Why do you disagree? (optional)" reasonMaxLength={NOTE_MAX} validateReason={optionalNote}
                confirmLabel="Ask for review"
                busy={review.isPending}
                onConfirm={(note) => review.mutate({ claim: reviewing, note })}
            />
        </div>
    );
}

export { CustomerWarrantySection };
