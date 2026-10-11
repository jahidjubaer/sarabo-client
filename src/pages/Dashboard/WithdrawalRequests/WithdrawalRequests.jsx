import { useId, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Banknote, Check, Copy, Info, X } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { walletKeys } from '../../../hooks/walletKeys';
import { notify } from '../../../lib/notify';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';

// Raised by the server when an admin removed this technician: their whole
// remaining balance, paid like any other withdrawal.
function FinalPayoutTag({ withdrawal }) {
    if (withdrawal?.reason !== 'technician_removed') return null;
    return <Badge tone="warning" className="mt-1">Final payout · technician removed</Badge>;
}

// Admin withdrawal queue (Phase 9).
//
// THIS RECORDS A PAYOUT, IT DOES NOT MAKE ONE. The technician gives a personal
// bKash number; the admin sends the money from the bKash app with "Send Money"
// and then records the bKash TrxID here. There is no bKash API behind "Mark
// paid", and the copy says so plainly, because a control that silently implied
// a real transfer would be the single most dangerous thing on this screen.
//
// EVERY FIGURE IS THE SERVER'S. The amount shown is the amount the server
// reserved when the technician requested it; this page never sums, derives or
// re-checks a balance, and deliberately shows no balance at all - the wallet
// endpoint is the only place a balance is computed, and a second display here
// would be a second answer that could drift from it.

const STATUS_OPTIONS = [
    { value: 'requested', label: 'Awaiting processing' },
    { value: 'paid', label: 'Paid' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All statuses' },
];


// Server codes surfaced as sentences. WITHDRAWAL_ALREADY_PROCESSED is the one
// that matters most: it is what a second admin sees when someone else has
// already settled the same row, and it must read as "someone got there first",
// not as a failure the admin should retry.
const PROCESS_ERROR_COPY = {
    WITHDRAWAL_ALREADY_PROCESSED: 'That withdrawal was already processed - refresh to see who settled it.',
    WITHDRAWAL_NOT_FOUND: 'That withdrawal no longer exists.',
    INVALID_WITHDRAWAL_ID: 'That withdrawal reference was not valid.',
    ADMIN_REQUIRED: 'You no longer have permission to process withdrawals.',
    BKASH_TRX_ID_REQUIRED: 'Enter the bKash TrxID of the payment you sent.',
    INVALID_BKASH_TRX_ID: 'A bKash TrxID is 8-12 letters and digits, like 9A7B6C5D4E.',
    BKASH_TRX_ID_ALREADY_USED: 'That TrxID is already recorded on another withdrawal. Check the bKash statement.',
};

// Codes that are about the TrxID the admin typed, shown under that field.
const TRX_ERROR_CODES = ['BKASH_TRX_ID_REQUIRED', 'INVALID_BKASH_TRX_ID', 'BKASH_TRX_ID_ALREADY_USED'];
const TRX_ID_PATTERN = /^[A-Z0-9]{8,12}$/;

const PAGE_LIMIT = 20;
const NOTE_MAX = 500;

function processErrorMessage(error) {
    const data = error?.response?.data;
    return PROCESS_ERROR_COPY[data?.code] || data?.message || 'The withdrawal could not be processed. Please try again.';
}

async function copyText(text, label) {
    try {
        await navigator.clipboard.writeText(text);
        notify.success(`${label} copied.`);
    } catch {
        notify.info(`${label}: ${text}`);
    }
}

// The technician's bKash number with a copy button, so the admin can paste it
// straight into the bKash app.
function BkashNumber({ payout, className }) {
    if (!payout) return <span className="text-ds-muted-foreground">Not given</span>;
    return (
        <div className={cn('min-w-0', className)}>
            <div className="flex items-center gap-1">
                <span className="ds-numeric whitespace-nowrap font-semibold text-ds-foreground">{payout.accountNumber}</span>
                <Button
                    variant="ghost" size="sm" className="size-8 shrink-0 p-0"
                    aria-label={`Copy bKash number ${payout.accountNumber}`}
                    onClick={() => copyText(payout.accountNumber, 'bKash number')}
                >
                    <Copy aria-hidden="true" className="size-3.5" />
                </Button>
            </div>
            {payout.accountName && <div className="truncate text-xs text-ds-muted-foreground">{payout.accountName}</div>}
        </div>
    );
}

// Mark-paid asks for the bKash TrxID (required for bKash withdrawals) plus an
// optional note. While busy it cannot be dismissed, like ConfirmDialog.
function MarkPaidDialog({ withdrawal, busy, serverError, onClose, onConfirm }) {
    const id = useId();
    const [trxId, setTrxId] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState(null);
    const needsTrx = !!withdrawal?.payout;
    const shownError = error || serverError;

    const handleOpenChange = (next) => {
        if (next || busy) return;
        setTrxId('');
        setNote('');
        setError(null);
        onClose();
    };

    const handleConfirm = () => {
        const value = trxId.trim().toUpperCase();
        if (needsTrx && !value) return setError('Enter the bKash TrxID of the payment you sent.');
        if (value && !TRX_ID_PATTERN.test(value)) return setError('A bKash TrxID is 8-12 letters and digits, like 9A7B6C5D4E.');
        const noteCheck = validateNote(note);
        if (!noteCheck.valid) return setError(noteCheck.message);
        setError(null);
        onConfirm({ bkashTrxId: value || undefined, note: note.trim() || undefined });
    };

    return (
        <Dialog open={!!withdrawal} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={!busy}>
                <DialogHeader>
                    <DialogTitle>Record this payout as paid?</DialogTitle>
                    {withdrawal && (
                        <DialogDescription>
                            {needsTrx
                                ? 'Send the money from the bKash app with Send Money first, then enter the TrxID from the bKash confirmation. Sarabo does not send any money. This cannot be undone.'
                                : 'This withdrawal has no bKash number (it was requested before bKash payouts). Record it only if you have already paid it. This cannot be undone.'}
                        </DialogDescription>
                    )}
                </DialogHeader>
                {withdrawal && (
                    <dl className="grid grid-cols-2 gap-3 rounded-ds-lg bg-ds-muted px-4 py-3 text-body-sm">
                        <div>
                            <dt className="text-ds-muted-foreground">Amount</dt>
                            <dd className="ds-numeric text-heading text-ds-foreground">{formatMoney(withdrawal.amount, withdrawal.currency)}</dd>
                        </div>
                        <div>
                            <dt className="text-ds-muted-foreground">Send to bKash</dt>
                            <dd><BkashNumber payout={withdrawal.payout} /></dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-ds-muted-foreground">Technician</dt>
                            <dd className="truncate text-ds-foreground">{withdrawal.technicianName || withdrawal.technicianEmail}</dd>
                        </div>
                    </dl>
                )}
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}-trx`}>{needsTrx ? 'bKash TrxID' : 'bKash TrxID (optional)'}</Label>
                    <Input
                        id={`${id}-trx`}
                        value={trxId}
                        onChange={(event) => { setTrxId(event.target.value); if (error) setError(null); }}
                        placeholder="e.g. 9A7B6C5D4E"
                        autoComplete="off"
                        spellCheck={false}
                        className="ds-numeric uppercase"
                        maxLength={20}
                        disabled={busy}
                        aria-invalid={shownError ? 'true' : 'false'}
                        aria-describedby={shownError ? `${id}-error` : undefined}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}-note`}>Note (optional)</Label>
                    <Textarea id={`${id}-note`} rows={2} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} />
                </div>
                {shownError && <p id={`${id}-error`} role="alert" className="text-body-sm font-medium text-ds-destructive">{shownError}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>Cancel</Button>
                    <LoadingButton variant="primary" onClick={handleConfirm} loading={busy} loadingText="Working…">Record as paid</LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function validateNote(value) {
    if (value.trim().length > NOTE_MAX) {
        return { valid: false, message: `Keep the note under ${NOTE_MAX} characters.` };
    }
    return { valid: true };
}

const WithdrawalRequests = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const [urlFilters, setUrlFilters] = useUrlFilters({ status: 'requested', page: '1' });
    const status = STATUS_OPTIONS.some((option) => option.value === urlFilters.status) ? urlFilters.status : 'requested';
    const { page } = urlFilters;
    // A single dialog driven by { withdrawal, action } rather than two booleans,
    // so mark-paid and reject can never both be open and the busy state always
    // belongs to the row actually being processed.
    const [pending, setPending] = useState(null);
    // A TrxID problem reported by the server, shown inside the mark-paid dialog.
    const [trxServerError, setTrxServerError] = useState(null);

    const filters = { status, page };
    const listQueryKey = walletKeys.adminList(filters);

    const { data, isPending, isPaused, isError, error, isFetching } = useQuery({
        queryKey: listQueryKey,
        queryFn: async () => {
            const params = { page, limit: PAGE_LIMIT };
            if (status !== 'all') params.status = status;
            const res = await axiosSecure.get('/admin/withdrawals', { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
        retry: 1,
    });

    const hasUsablePage = Array.isArray(data?.withdrawals);
    const isInitialLoading = isPending && !isPaused && !hasUsablePage;
    const isUnavailableBeforeData = !hasUsablePage && (isPaused || isError);

    const processMutation = useMutation({
        mutationFn: async ({ id, action, note, bkashTrxId }) => {
            const path = action === 'paid' ? 'mark-paid' : 'reject';
            const body = {};
            if (note) body.note = note;
            if (bkashTrxId) body.bkashTrxId = bkashTrxId;
            const res = await axiosSecure.post(`/admin/withdrawals/${id}/${path}`, body);
            return res.data;
        },
        onSuccess: (result, variables) => {
            notify.success(variables.action === 'paid' ? 'Withdrawal recorded as paid.' : 'Withdrawal rejected.');
            setPending(null);
            setTrxServerError(null);
            // The whole admin namespace, not just this page: processing a row
            // changes which status buckets it belongs to, so every cached filter
            // combination is now stale.
            queryClient.invalidateQueries({ queryKey: walletKeys.adminAll });
        },
        onError: (mutationError) => {
            notify.error(processErrorMessage(mutationError));
            if (TRX_ERROR_CODES.includes(mutationError?.response?.data?.code)) setTrxServerError(processErrorMessage(mutationError));
            // Deliberately NOT closing the dialog on a conflict: refreshing the
            // list underneath lets the admin see the row's real state without
            // losing the note they typed.
            queryClient.invalidateQueries({ queryKey: walletKeys.adminAll });
        },
    });

    const columns = useMemo(() => [
        {
            id: 'technician', header: 'Technician', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="truncate text-ds-foreground">{row.original.technicianName || 'Unnamed technician'}</div>
                    <div className="truncate text-xs text-ds-muted-foreground">{row.original.technicianEmail}</div>
                    <FinalPayoutTag withdrawal={row.original} />
                </div>
            ),
            meta: { label: 'Technician' },
        },
        {
            id: 'amount', header: 'Amount', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <span className="ds-numeric whitespace-nowrap font-semibold text-ds-foreground">
                    {formatMoney(row.original.amount, row.original.currency)}
                </span>
            ),
            meta: { label: 'Amount' },
        },
        {
            id: 'bkash', header: 'bKash', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div>
                    <BkashNumber payout={row.original.payout} />
                    {row.original.payoutReference && (
                        <div className="ds-numeric whitespace-nowrap text-xs text-ds-muted-foreground">TrxID {row.original.payoutReference}</div>
                    )}
                </div>
            ),
            meta: { label: 'bKash' },
        },
        {
            id: 'requested', header: 'Requested', enableSorting: false,
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-ds-muted-foreground">
                    {row.original.requestedAt ? formatAbsoluteDateTime(row.original.requestedAt) : '—'}
                </span>
            ),
            meta: { label: 'Requested' },
        },
        {
            id: 'status', header: 'Status', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <StatusBadge domain="withdrawal" status={row.original.status} audience="admin" />
            ),
            meta: { label: 'Status' },
        },
        {
            id: 'processed', header: 'Processed', enableSorting: false,
            cell: ({ row }) => {
                if (!row.original.processedAt) return <span className="text-ds-muted-foreground">—</span>;
                return (
                    <div className="min-w-0">
                        <div className="whitespace-nowrap text-ds-foreground">{formatAbsoluteDateTime(row.original.processedAt)}</div>
                        {row.original.processedBy && <div className="truncate text-xs text-ds-muted-foreground">{row.original.processedBy}</div>}
                    </div>
                );
            },
            meta: { label: 'Processed' },
        },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => {
                // Only an open withdrawal is actionable. A processed row shows
                // nothing rather than a disabled button, because there is no
                // state in which it becomes actionable again.
                if (row.original.status !== 'requested') return null;
                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="outline" size="sm"
                            aria-label={`Mark ${row.original.technicianEmail}'s withdrawal as paid`}
                            onClick={() => setPending({ withdrawal: row.original, action: 'paid' })}
                        >
                            <Check aria-hidden="true" />Mark paid
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            aria-label={`Reject ${row.original.technicianEmail}'s withdrawal`}
                            onClick={() => setPending({ withdrawal: row.original, action: 'rejected' })}
                        >
                            <X aria-hidden="true" />Reject
                        </Button>
                    </div>
                );
            },
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], []);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Withdrawals" />
                <ErrorState
                    title="Couldn't load withdrawal requests"
                    description={error?.response?.data?.message || "We couldn't load the withdrawal queue right now. Please try again."}
                    onRetry={() => queryClient.resetQueries({ queryKey: listQueryKey })}
                />
            </div>
        );
    }

    const withdrawals = hasUsablePage ? data.withdrawals : [];
    const total = hasUsablePage ? data.total : 0;
    const totalPages = hasUsablePage ? data.totalPages : 1;
    const currentPage = hasUsablePage ? data.page : 1;

    const renderCard = (withdrawal) => (
        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ds-foreground">{withdrawal.technicianName || 'Unnamed technician'}</p>
                    <p className="truncate text-xs text-ds-muted-foreground">{withdrawal.technicianEmail}</p>
                    <FinalPayoutTag withdrawal={withdrawal} />
                </div>
                <StatusBadge domain="withdrawal" status={withdrawal.status} audience="admin" className="shrink-0" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                    <dt className="text-ds-muted-foreground">Amount</dt>
                    <dd className="ds-numeric font-semibold text-ds-foreground">{formatMoney(withdrawal.amount, withdrawal.currency)}</dd>
                </div>
                <div>
                    <dt className="text-ds-muted-foreground">Requested</dt>
                    <dd className="text-ds-foreground">{withdrawal.requestedAt ? formatAbsoluteDateTime(withdrawal.requestedAt) : '—'}</dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-ds-muted-foreground">bKash</dt>
                    <dd>
                        <BkashNumber payout={withdrawal.payout} />
                        {withdrawal.payoutReference && <span className="ds-numeric text-ds-muted-foreground">TrxID {withdrawal.payoutReference}</span>}
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-ds-muted-foreground">Processed</dt>
                    <dd className="text-ds-foreground">
                        {withdrawal.processedAt ? formatAbsoluteDateTime(withdrawal.processedAt) : 'Not yet processed'}
                    </dd>
                </div>
            </dl>
            {withdrawal.status === 'requested' && (
                <div className="mt-3 flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => setPending({ withdrawal, action: 'paid' })}><Check aria-hidden="true" />Mark paid</Button>
                    <Button variant="outline" size="sm" onClick={() => setPending({ withdrawal, action: 'rejected' })}><X aria-hidden="true" />Reject</Button>
                </div>
            )}
        </div>
    );

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Label htmlFor="withdrawal-status" className="sr-only">Filter by status</Label>
            <Select
                id="withdrawal-status"
                value={status}
                onChange={(event) => setUrlFilters({ status: event.target.value, page: 1 })} size="sm" wrapperClassName="sm:w-52"
            >
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
        </div>
    );

    const isMarkPaid = pending?.action === 'paid';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Withdrawals"
                description={isInitialLoading ? 'Loading withdrawal requests…' : `${total} withdrawal${total === 1 ? '' : 's'} in this view`}
            />
            <p className="flex items-start gap-2 rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span><strong className="font-semibold text-ds-foreground">Pay first, then record it here.</strong> Send the amount to the technician's bKash number with bKash Send Money, then mark it paid with the TrxID from the bKash confirmation. Sarabo does not send any money.</span>
            </p>
            <p className={cn("text-sm text-ds-muted-foreground transition-opacity", isFetching ? "opacity-100" : "opacity-0")} role="status" aria-live="polite">
                Updating results…
            </p>
            <AdminDataTable
                caption="Technician withdrawal requests"
                pageSize={PAGE_LIMIT}
                totalRows={total}
                columns={columns}
                data={withdrawals}
                isLoading={isInitialLoading}
                enableColumnVisibility
                getRowId={(row) => row.id}
                toolbar={toolbar}
                renderCard={renderCard}
                manualPagination
                pageCount={totalPages}
                pageIndex={currentPage - 1}
                onPageChange={(index) => setUrlFilters({ page: index + 1 })}
                emptyState={
                    <EmptyState
                        icon={Banknote}
                        title={status === 'requested' ? 'Nothing awaiting processing' : 'No withdrawals here'}
                        description={status === 'requested'
                            ? 'Withdrawal requests appear here as technicians ask to be paid out.'
                            : 'No withdrawals match this filter.'}
                        action={status !== 'requested'
                            ? <Button variant="outline" size="sm" onClick={() => setUrlFilters({ status: 'requested', page: 1 })}>Show awaiting processing</Button>
                            : undefined}
                    />
                }
            />

            <MarkPaidDialog
                key={isMarkPaid ? pending.withdrawal.id : 'closed'}
                withdrawal={isMarkPaid ? pending.withdrawal : null}
                busy={processMutation.isPending}
                serverError={trxServerError}
                onClose={() => { setPending(null); setTrxServerError(null); }}
                onConfirm={({ bkashTrxId, note }) => {
                    setTrxServerError(null);
                    processMutation.mutate({ id: pending.withdrawal.id, action: 'paid', note, bkashTrxId });
                }}
            />

            <ConfirmDialog
                open={!!pending && !isMarkPaid}
                onOpenChange={(next) => { if (!next) setPending(null); }}
                title="Reject this withdrawal?"
                description={pending && !isMarkPaid
                    ? `${formatMoney(pending.withdrawal.amount, pending.withdrawal.currency)} returns to ${pending.withdrawal.technicianEmail}'s available balance and they can request it again. It cannot be undone.`
                    : undefined}
                confirmLabel="Reject withdrawal"
                destructive
                busy={processMutation.isPending}
                reason
                reasonLabel="Reason (optional)"
                reasonPlaceholder="e.g. the bKash number is wrong"
                validateReason={validateNote}
                onConfirm={(note) => processMutation.mutate({ id: pending.withdrawal.id, action: 'rejected', note })}
            />
        </div>
    );
};

export default WithdrawalRequests;
