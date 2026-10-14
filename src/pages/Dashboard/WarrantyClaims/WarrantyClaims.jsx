import { useId, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useRole from '../../../hooks/useRole';
import {
    listTechnicianClaims, scheduleInspection, decideClaim, reportRerepair, listAdminClaims, reviewClaim, refundClaim,
    adminDecideClaim, adminCannotFix,
} from '../../../api/warranty';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { notify } from '../../../lib/notify';
import { NOT_COVERED_REASONS, NOTE_MAX, warrantyErrorMessage } from '../../../utils/warranty';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { DetailSkeleton } from '../../../components/common/Skeletons';
import { WarrantyClaimCard } from '../../../components/warranty/WarrantyClaimCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';

const needsNote = (value) => (value.trim().length < 10
    ? { valid: false, message: 'Please explain in at least 10 characters.' }
    : value.length > NOTE_MAX ? { valid: false, message: `Keep it under ${NOTE_MAX} characters.` } : { valid: true });
const optionalNote = (value) => (value.length > NOTE_MAX ? { valid: false, message: `Keep it under ${NOTE_MAX} characters.` } : { valid: true });

// "2026-10-15T10:00" for a datetime-local input, in the viewer's time zone.
function localInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function RequestLink({ claim, to }) {
    return <Link to={to} className="focus-ring text-micro font-medium text-ds-primary underline-offset-2 hover:underline">Repair {claim.trackingId}</Link>;
}

// Book (or move) the free re-inspection visit.
function ScheduleDialog({ claim, onClose, onSaved }) {
    const id = useId();
    const axiosSecure = useAxiosSecure();
    // Defaults to 10:00 tomorrow; `earliest` stops picking a time in the past.
    const [earliest] = useState(() => localInputValue(new Date()));
    const [visitAt, setVisitAt] = useState(() => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        tomorrow.setHours(10, 0, 0, 0);
        return localInputValue(tomorrow);
    });
    const [note, setNote] = useState('');
    const save = useMutation({
        mutationFn: () => scheduleInspection(axiosSecure, claim.id, { visitAt: new Date(visitAt).toISOString(), note: note.trim() }),
        onSuccess: () => { notify.success('Re-inspection booked. The customer has been told.'); onSaved(); },
        onError: (err) => notify.error(warrantyErrorMessage(err, "The visit couldn't be booked.")),
    });
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Book the free re-inspection</DialogTitle>
                    <DialogDescription>Choose a time within the next 14 days. The customer is told straight away.</DialogDescription>
                </DialogHeader>
                <form id={`${id}-form`} className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-when`} className="text-body-sm font-semibold">Visit time</label>
                        <Input id={`${id}-when`} type="datetime-local" required value={visitAt} min={earliest} onChange={(e) => setVisitAt(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-note`} className="text-body-sm font-semibold">Note to the customer (optional)</label>
                        <Textarea id={`${id}-note`} rows={2} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
                    <LoadingButton type="submit" form={`${id}-form`} loading={save.isPending} loadingText="Booking…">Book visit</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const DUE_COPY = {
    not_booked: 'Book the re-inspection by',
    not_decided: 'Record the decision by',
    not_repaired: 'Repair it again by',
};
const OVERDUE_COPY = {
    not_booked: 'The technician has not booked the re-inspection in time.',
    not_decided: 'The technician has not recorded a decision in time.',
    not_repaired: 'The technician has not repaired it again in time.',
};

// After re-inspecting: covered, or not covered with a reason and explanation.
// An admin uses the same form to take over a late decision (asAdmin).
function DecisionDialog({ claim, onClose, onSaved, asAdmin = false }) {
    const id = useId();
    const axiosSecure = useAxiosSecure();
    const [covered, setCovered] = useState('yes');
    const [reason, setReason] = useState('new_damage');
    const [note, setNote] = useState('');
    const notCovered = covered === 'no';
    const noteInvalid = notCovered && note.trim().length < 10;
    const save = useMutation({
        mutationFn: () => (asAdmin ? adminDecideClaim : decideClaim)(axiosSecure, claim.id, { covered: !notCovered, reason: notCovered ? reason : undefined, note: note.trim() }),
        onSuccess: () => { notify.success(notCovered ? 'Saved. The customer can ask an admin to review it.' : 'Saved. Please repair it again for free.'); onSaved(); },
        onError: (err) => notify.error(warrantyErrorMessage(err, "The decision couldn't be saved.")),
    });
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Is this covered by the warranty?</DialogTitle>
                    <DialogDescription>Covered: the repaired fault came back, or a part you fitted failed. Not covered: new damage, water damage or a drop.</DialogDescription>
                </DialogHeader>
                <form id={`${id}-form`} className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!noteInvalid) save.mutate(); }}>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-covered`} className="text-body-sm font-semibold">Decision</label>
                        <Select id={`${id}-covered`} value={covered} onChange={(e) => setCovered(e.target.value)}>
                            <option value="yes">{asAdmin ? 'Covered - the technician repairs it again for free' : 'Covered - I will repair it again for free'}</option>
                            <option value="no">Not covered</option>
                        </Select>
                    </div>
                    {notCovered && (
                        <div className="space-y-1.5">
                            <label htmlFor={`${id}-reason`} className="text-body-sm font-semibold">Why not?</label>
                            <Select id={`${id}-reason`} value={reason} onChange={(e) => setReason(e.target.value)}>
                                {NOT_COVERED_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-note`} className="text-body-sm font-semibold">{notCovered ? 'Explain what you found (required)' : 'Note (optional)'}</label>
                        <Textarea id={`${id}-note`} rows={3} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder={notCovered ? 'For example: the frame is bent and the new crack starts at the corner.' : ''} />
                        {notCovered && <p className="text-micro text-ds-muted-foreground">The customer sees this and can ask an admin to review it.</p>}
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
                    <LoadingButton type="submit" form={`${id}-form`} loading={save.isPending} loadingText="Saving…" disabled={noteInvalid}>Save decision</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TechnicianClaims() {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const key = ['warranty-claims', 'technician'];
    const query = useQuery({ queryKey: key, queryFn: () => listTechnicianClaims(axiosSecure) });
    const [dialog, setDialog] = useState(null); // { type, claim }
    const done = () => { setDialog(null); queryClient.invalidateQueries({ queryKey: key }); };
    const rerepair = useMutation({
        mutationFn: ({ claim, outcome, note }) => reportRerepair(axiosSecure, claim.id, { outcome, note }),
        onSuccess: (_, { outcome }) => { notify.success(outcome === 'fixed' ? 'Saved. The customer will confirm it works.' : 'Saved. An admin will refund the customer.'); done(); },
        onError: (err) => { notify.error(warrantyErrorMessage(err, "The result couldn't be saved.")); done(); },
    });

    if (query.isPending) return <DetailSkeleton />;
    if (query.isError) return <ErrorState title="Couldn't load warranty claims" onRetry={() => query.refetch()} />;
    const claims = query.data.claims;
    if (claims.length === 0) {
        return <EmptyState icon={ShieldCheck} title="No warranty claims" description="If a customer reports a problem with one of your repairs within 30 days, it shows here." />;
    }
    return (
        <div className="space-y-4">
            {claims.map((claim) => (
                <WarrantyClaimCard key={claim.id} claim={claim} audience="technician" heading={<RequestLink claim={claim} to={`/dashboard/assigned-jobs/${claim.requestId}`} />}>
                    {claim.technicianDue?.dueAt && (
                        <p className="w-full text-body-sm text-ds-muted-foreground">
                            {DUE_COPY[claim.technicianDue.reason]} <time dateTime={claim.technicianDue.dueAt}>{formatAbsoluteDateTime(claim.technicianDue.dueAt)}</time> - after that an admin can take it over.
                        </p>
                    )}
                    {['submitted', 'inspection_scheduled'].includes(claim.status) && (
                        <Button variant={claim.status === 'submitted' ? 'action' : 'outline'} onClick={() => setDialog({ type: 'schedule', claim })}>
                            {claim.status === 'submitted' ? 'Book re-inspection' : 'Change visit time'}
                        </Button>
                    )}
                    {claim.status === 'inspection_scheduled' && <Button variant="action" onClick={() => setDialog({ type: 'decide', claim })}>Record decision</Button>}
                    {claim.status === 'covered' && <>
                        <Button variant="action" onClick={() => setDialog({ type: 'rerepair', claim, outcome: 'fixed' })}>Repaired again</Button>
                        <Button variant="outline" onClick={() => setDialog({ type: 'rerepair', claim, outcome: 'cannot_fix' })}>Can't fix it</Button>
                    </>}
                </WarrantyClaimCard>
            ))}
            {dialog?.type === 'schedule' && <ScheduleDialog claim={dialog.claim} onClose={() => setDialog(null)} onSaved={done} />}
            {dialog?.type === 'decide' && <DecisionDialog claim={dialog.claim} onClose={() => setDialog(null)} onSaved={done} />}
            <ConfirmDialog
                open={dialog?.type === 'rerepair'}
                onOpenChange={(open) => { if (!open) setDialog(null); }}
                title={dialog?.outcome === 'fixed' ? 'Repaired again?' : "Can't fix it?"}
                description={dialog?.outcome === 'fixed'
                    ? 'The customer is asked to confirm it works.'
                    : "An admin refunds the customer the repair amount, and your share of this repair is taken back from your wallet."}
                reason reasonLabel={dialog?.outcome === 'fixed' ? 'What did you do? (optional)' : 'Why not? (optional)'} reasonMaxLength={NOTE_MAX} validateReason={optionalNote}
                confirmLabel={dialog?.outcome === 'fixed' ? 'Yes, repaired' : "Can't fix it"}
                destructive={dialog?.outcome === 'cannot_fix'}
                busy={rerepair.isPending}
                onConfirm={(note) => rerepair.mutate({ claim: dialog.claim, outcome: dialog.outcome, note })}
            />
        </div>
    );
}

function AdminClaims() {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('needs_action');
    const key = ['warranty-claims', 'admin', filter];
    const query = useQuery({ queryKey: key, queryFn: () => listAdminClaims(axiosSecure, filter) });
    const [dialog, setDialog] = useState(null); // { type, claim, decision? }
    const done = () => { setDialog(null); queryClient.invalidateQueries({ queryKey: ['warranty-claims', 'admin'] }); };
    const review = useMutation({
        mutationFn: ({ claim, decision, note }) => reviewClaim(axiosSecure, claim.id, { decision, note }),
        onSuccess: () => { notify.success('Review saved. The customer and technician have been told.'); done(); },
        onError: (err) => { notify.error(warrantyErrorMessage(err, "The review couldn't be saved.")); done(); },
    });
    const cannotFix = useMutation({
        mutationFn: ({ claim, note }) => adminCannotFix(axiosSecure, claim.id, { note }),
        onSuccess: () => { notify.success('Moved to a refund.'); done(); },
        onError: (err) => { notify.error(warrantyErrorMessage(err, "The claim couldn't be changed.")); done(); },
    });
    const refund = useMutation({
        mutationFn: ({ claim }) => refundClaim(axiosSecure, claim.id),
        onSuccess: () => { notify.success('Refund sent.'); done(); },
        onError: (err) => { notify.error(warrantyErrorMessage(err, 'The refund failed.')); done(); },
    });

    return (
        <div className="space-y-4">
            <label className="flex max-w-xs items-center gap-2 text-body-sm text-ds-muted-foreground">
                Show
                <Select size="sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="needs_action">Needs an admin</option>
                    <option value="all">All claims</option>
                </Select>
            </label>
            {query.isPending ? <DetailSkeleton />
                : query.isError ? <ErrorState title="Couldn't load warranty claims" onRetry={() => query.refetch()} />
                    : query.data.claims.length === 0
                        ? <EmptyState icon={ShieldCheck} title={filter === 'needs_action' ? 'Nothing waiting' : 'No warranty claims yet'}
                            description="Reviews customers ask for and refunds to make show here." />
                        : query.data.claims.map((claim) => (
                            <WarrantyClaimCard key={claim.id} claim={claim} audience="admin" heading={
                                <p className="flex flex-wrap gap-x-3 text-micro text-ds-muted-foreground">
                                    <RequestLink claim={claim} to={`/dashboard/manage-repair-requests/${claim.requestId}`} />
                                    <span>Customer {claim.customerEmail}</span>
                                    <span>Technician {claim.technicianName}</span>
                                </p>
                            }>
                                {claim.overdue && (
                                    <p className="w-full text-body-sm font-medium text-ds-destructive">{OVERDUE_COPY[claim.overdue.reason]} You can take it over.</p>
                                )}
                                {claim.overdue && ['submitted', 'inspection_scheduled'].includes(claim.status) && (
                                    <Button variant="action" onClick={() => setDialog({ type: 'decide', claim })}>Decide instead</Button>
                                )}
                                {claim.overdue && claim.status === 'covered' && (
                                    <Button variant="action" onClick={() => setDialog({ type: 'cannotFix', claim })}>Move to refund</Button>
                                )}
                                {claim.status === 'review_requested' && <>
                                    <Button variant="action" onClick={() => setDialog({ type: 'review', claim, decision: 'overturn' })}>Change to covered</Button>
                                    <Button variant="outline" onClick={() => setDialog({ type: 'review', claim, decision: 'uphold' })}>Keep "not covered"</Button>
                                </>}
                                {claim.status === 'refund_pending' && (
                                    <Button variant="action" onClick={() => setDialog({ type: 'refund', claim })}>
                                        {claim.refund ? 'Retry refund' : 'Refund the repair amount'}
                                    </Button>
                                )}
                                {claim.refund?.parts?.some((p) => p.status === 'failed') && (
                                    <p className="w-full text-micro text-ds-destructive">Last attempt failed: {claim.refund.parts.find((p) => p.status === 'failed').lastError}</p>
                                )}
                            </WarrantyClaimCard>
                        ))}
            <ConfirmDialog
                open={dialog?.type === 'review'}
                onOpenChange={(open) => { if (!open) setDialog(null); }}
                title={dialog?.decision === 'overturn' ? 'Change the decision to covered?' : 'Keep the "not covered" decision?'}
                description={dialog?.decision === 'overturn'
                    ? 'The technician must repair it again for free. Both sides are told.'
                    : 'The claim is closed. Both sides are told.'}
                reason reasonLabel="Explanation (both sides see it)" reasonMaxLength={NOTE_MAX} validateReason={needsNote}
                confirmLabel={dialog?.decision === 'overturn' ? 'Change to covered' : 'Keep decision'}
                busy={review.isPending}
                onConfirm={(note) => review.mutate({ claim: dialog.claim, decision: dialog.decision, note })}
            />
            {dialog?.type === 'decide' && <DecisionDialog claim={dialog.claim} asAdmin onClose={() => setDialog(null)} onSaved={done} />}
            <ConfirmDialog
                open={dialog?.type === 'cannotFix'}
                onOpenChange={(open) => { if (!open) setDialog(null); }}
                title="Move this claim to a refund?"
                description="The technician did not repair it again in time. The customer is told a refund is coming; then refund it from this page."
                reason reasonLabel="Note (optional)" reasonMaxLength={NOTE_MAX} validateReason={optionalNote}
                confirmLabel="Move to refund"
                busy={cannotFix.isPending}
                onConfirm={(note) => cannotFix.mutate({ claim: dialog.claim, note })}
            />
            <ConfirmDialog
                open={dialog?.type === 'refund'}
                onOpenChange={(open) => { if (!open) setDialog(null); }}
                title="Refund the repair amount?"
                description="Refunds the customer's repair payment and the inspection fee that counted toward it (Stripe test mode), and takes the technician's share of this repair back from their wallet. A retry never refunds twice."
                confirmLabel="Refund"
                busy={refund.isPending}
                busyLabel="Refunding…"
                onConfirm={() => refund.mutate({ claim: dialog.claim })}
            />
        </div>
    );
}

// /dashboard/warranty-claims - technicians and admins (the links in their
// warranty notifications point here). Customers handle claims on their repair.
export default function WarrantyClaims() {
    const { role, roleLoading } = useRole();
    if (roleLoading) return <DetailSkeleton />;
    if (role !== 'rider' && role !== 'admin') return <Navigate to="/dashboard" replace />;
    return (
        <div className="space-y-6">
            <PageHeader
                title="Warranty claims"
                description={role === 'admin'
                    ? 'Decide disputed claims and refund repairs that could not be fixed again.'
                    : 'Customers can report a problem within 30 days of getting their device back. Book the free re-inspection within 3 days, decide within 3 days of the visit, and repair covered claims within 7 days.'}
            />
            {role === 'admin' ? <AdminClaims /> : <TechnicianClaims />}
        </div>
    );
}
