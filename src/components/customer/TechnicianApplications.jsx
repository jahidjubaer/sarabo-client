import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Briefcase, CheckCircle2, MapPin, Star, Wrench, XCircle } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useRequestApplications, jobPortalKeys } from '../../hooks/useJobPortal';
import { acceptApplication, declineApplication } from '../../api/jobPortal';
import { DECLINE_REASONS } from '../../utils/jobBoard';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import { notify } from '../../lib/notify';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ChoiceCard } from '../ui/choice-card';

const DECLINE_NOTE_MAX = 300;

const ERROR_COPY = {
    TECHNICIAN_BUSY: 'That technician is on another job right now. Choose another, or try again later.',
    TECHNICIAN_NOT_ELIGIBLE: 'That technician can no longer take this repair. Please choose another.',
    APPLICATION_NOT_PENDING: 'That application is no longer open.',
    CHECKOUT_CREATION_IN_PROGRESS: 'The payment page is already opening. Please wait a moment and try again.',
    CHECKOUT_UNAVAILABLE: "The payment page couldn't be opened. Please try again.",
    JOB_NOT_OPEN: 'A technician has already been chosen for this request.',
};

function Stat({ icon, children }) {
    const StatIcon = icon;
    return <span className="inline-flex items-center gap-1"><StatIcon aria-hidden="true" className="size-3.5" />{children}</span>;
}

// The customer compares technicians' applications and chooses one
// (job-portal phase B). Shown on the customer's request while it is open.
// Not happy with an offer (price, fee or anything else)? Rejecting it reposts
// the request to the open jobs board; that technician may revise it once.
function TechnicianApplications({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const { data, isPending } = useRequestApplications(request._id);
    const [choosing, setChoosing] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [rejectReason, setRejectReason] = useState('price');
    const refreshApplications = () => queryClient.invalidateQueries({ queryKey: jobPortalKeys.applications(request._id) });

    const reject = useMutation({
        mutationFn: ({ application, note }) => declineApplication(axiosSecure, request._id, application.id, { reason: rejectReason, note }),
        onSuccess: () => {
            setRejecting(null);
            refreshApplications();
            notify.success('Offer rejected. Your request is posted again for technicians.');
        },
        onError: (error) => {
            setRejecting(null);
            refreshApplications();
            notify.error(ERROR_COPY[error?.response?.data?.code] || "That offer couldn't be rejected. Please try again.");
        },
    });

    const accept = useMutation({
        mutationFn: (application) => acceptApplication(axiosSecure, request._id, application.id),
        onSuccess: (result) => {
            // A fee: pay it on Stripe; the technician is booked once it is paid.
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
                return;
            }
            setChoosing(null);
            queryClient.invalidateQueries({ queryKey: jobPortalKeys.applications(request._id) });
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            notify.success(`${result.technicianName || 'Your technician'} is booked for your pickup time.`);
        },
        onError: (error) => {
            setChoosing(null);
            queryClient.invalidateQueries({ queryKey: jobPortalKeys.applications(request._id) });
            notify.error(ERROR_COPY[error?.response?.data?.code] || 'That technician could not be booked. Please try again.');
        },
    });

    if (isPending) return <div className="space-y-3">{[0, 1].map((k) => <Skeleton key={k} className="h-28 w-full" />)}</div>;
    const pending = (data?.applications ?? []).filter((a) => a.status === 'pending');
    const rejected = (data?.applications ?? []).filter((a) => a.status === 'declined');
    const rejectedList = rejected.length > 0 ? (
        <details className="rounded-ds-lg border border-ds-border p-3 text-body-sm">
            <summary className="cursor-pointer font-medium text-ds-muted-foreground">Offers you rejected ({rejected.length})</summary>
            <ul className="mt-2 space-y-1.5">
                {rejected.map((a) => (
                    <li key={a.id} className="flex flex-wrap justify-between gap-2 text-ds-muted-foreground">
                        <span>{a.technician.name}{a.canReoffer ? ' - may send a revised offer' : ''}</span>
                        <span className="ds-numeric">{formatMoneyRange(a.estimateMin, a.estimateMax, 'BDT')} · fee {formatMoney(a.inspectionFee, 'BDT')}</span>
                    </li>
                ))}
            </ul>
        </details>
    ) : null;
    if (pending.length === 0) {
        return (
            <div className="space-y-3">
                <p className="text-body-sm text-ds-muted-foreground">
                    {rejected.length > 0
                        ? "Your request is posted again. You'll be notified when a technician sends a new offer."
                        : "No technician has applied yet. You'll be notified when one does - most apply within a day."}
                </p>
                {rejectedList}
            </div>
        );
    }

    return (
        <>
            <ul className="space-y-3" aria-label="Applications">
                {pending.map((application) => {
                    const t = application.technician;
                    return (
                        <li key={application.id} className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-1.5">
                                    <p className="font-semibold text-ds-foreground">{t.name}</p>
                                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-micro text-ds-muted-foreground">
                                        {t.averageRating !== null
                                            ? <Stat icon={Star}>{t.averageRating} ({t.reviewCount} review{t.reviewCount === 1 ? '' : 's'})</Stat>
                                            : <Stat icon={Star}>No reviews yet</Stat>}
                                        {t.level && <Stat icon={Award}>{humanizeSlug(t.level)}</Stat>}
                                        {Number.isFinite(t.experienceYears) && <Stat icon={Briefcase}>{t.experienceYears} yr{t.experienceYears === 1 ? '' : 's'}</Stat>}
                                        <Stat icon={Wrench}>{t.completedRepairs} repair{t.completedRepairs === 1 ? '' : 's'} done</Stat>
                                        {t.district && <Stat icon={MapPin}>{t.district}</Stat>}
                                    </p>
                                    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
                                        <div><dt className="inline text-ds-muted-foreground">Estimate </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(application.estimateMin, application.estimateMax, 'BDT')}</dd></div>
                                        <div><dt className="inline text-ds-muted-foreground">Inspection fee </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoney(application.inspectionFee, 'BDT')}</dd></div>
                                    </dl>
                                    {application.note && <p className="text-body-sm text-ds-foreground">“{application.note}”</p>}
                                    {application.revised && <Badge tone="neutral">Revised offer</Badge>}
                                </div>
                                <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                                    <Button variant="action" onClick={() => setChoosing(application)} disabled={accept.isPending || reject.isPending}>
                                        <CheckCircle2 aria-hidden="true" /> Choose
                                    </Button>
                                    <Button variant="outline" onClick={() => { setRejectReason('price'); setRejecting(application); }} disabled={accept.isPending || reject.isPending}>
                                        <XCircle aria-hidden="true" /> Reject
                                    </Button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {rejectedList && <div className="mt-3">{rejectedList}</div>}
            <ConfirmDialog
                open={Boolean(rejecting)}
                onOpenChange={(open) => { if (!open) setRejecting(null); }}
                title={rejecting ? `Reject ${rejecting.technician.name}'s offer?` : ''}
                description={rejecting && !rejecting.revised
                    ? 'Your request is posted again for technicians. This technician may send you one revised offer.'
                    : 'Your request is posted again for technicians. This was their revised offer, so they cannot send another.'}
                summary={rejecting ? (
                    <fieldset className="space-y-2">
                        <legend className="mb-1 text-body-sm font-semibold text-ds-foreground">Why?</legend>
                        {DECLINE_REASONS.map((option) => (
                            <ChoiceCard
                                key={option.value}
                                name="reject-reason"
                                value={option.value}
                                label={option.label}
                                checked={rejectReason === option.value}
                                onChange={() => setRejectReason(option.value)}
                                disabled={reject.isPending}
                                className="[&_.text-subhead]:text-body-sm [&>span]:p-3"
                            />
                        ))}
                    </fieldset>
                ) : null}
                reason
                reasonLabel="Message to the technician (optional)"
                reasonPlaceholder="For example: my budget is around 1,500 taka"
                reasonMaxLength={DECLINE_NOTE_MAX}
                confirmLabel="Reject and repost"
                confirmVariant="destructive"
                busy={reject.isPending}
                busyLabel="Rejecting…"
                onConfirm={(note) => reject.mutate({ application: rejecting, note })}
            />
            <ConfirmDialog
                open={Boolean(choosing)}
                onOpenChange={(open) => { if (!open) setChoosing(null); }}
                title={choosing ? `Choose ${choosing.technician.name}?` : ''}
                description={choosing && choosing.inspectionFee > 0
                    ? 'You pay the inspection fee now to book their visit. Once it is paid, they are booked for your pickup time and the other applications are closed.'
                    : 'They will be booked for your pickup time and the other applications will be closed.'}
                summary={choosing ? (
                    <dl className="space-y-1 text-body-sm">
                        <div className="flex justify-between gap-3"><dt className="text-ds-muted-foreground">Estimate</dt><dd className="ds-numeric font-semibold">{formatMoneyRange(choosing.estimateMin, choosing.estimateMax, 'BDT')}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-ds-muted-foreground">Inspection fee</dt><dd className="ds-numeric font-semibold">{formatMoney(choosing.inspectionFee, 'BDT')}</dd></div>
                        <p className="pt-1 text-micro text-ds-muted-foreground">The final price is set after the technician inspects the device. The inspection fee counts toward it if you go ahead. If they can't be booked after you pay, it is refunded.</p>
                    </dl>
                ) : null}
                confirmLabel={choosing && choosing.inspectionFee > 0 ? `Pay ${formatMoney(choosing.inspectionFee, 'BDT')} and book` : 'Choose technician'}
                busy={accept.isPending}
                busyLabel={choosing && choosing.inspectionFee > 0 ? 'Opening payment…' : 'Booking…'}
                onConfirm={() => accept.mutate(choosing)}
            />
        </>
    );
}

export { TechnicianApplications };
