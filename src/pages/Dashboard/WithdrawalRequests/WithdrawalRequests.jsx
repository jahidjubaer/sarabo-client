import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Banknote, Check, X } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { walletKeys } from '../../../hooks/walletKeys';
import { notify } from '../../../lib/notify';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { AdminPageLead } from '../../../components/admin/AdminPageLead';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';

// Admin withdrawal queue (Phase 9).
//
// THIS RECORDS A PAYOUT, IT DOES NOT MAKE ONE. There is no bKash, Nagad, bank
// or Stripe Connect integration behind "Mark paid" - an admin settles the money
// out of band and then records that here. The confirm copy says so plainly,
// because a control that silently implied a real transfer would be the single
// most dangerous thing on this screen.
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

const STATUS_TONE = { requested: 'warning', paid: 'success', rejected: 'danger' };
const STATUS_LABEL = { requested: 'Awaiting processing', paid: 'Paid', rejected: 'Rejected' };

// Server codes surfaced as sentences. WITHDRAWAL_ALREADY_PROCESSED is the one
// that matters most: it is what a second admin sees when someone else has
// already settled the same row, and it must read as "someone got there first",
// not as a failure the admin should retry.
const PROCESS_ERROR_COPY = {
    WITHDRAWAL_ALREADY_PROCESSED: 'That withdrawal was already processed - refresh to see who settled it.',
    WITHDRAWAL_NOT_FOUND: 'That withdrawal no longer exists.',
    INVALID_WITHDRAWAL_ID: 'That withdrawal reference was not valid.',
    ADMIN_REQUIRED: 'You no longer have permission to process withdrawals.',
};

const PAGE_LIMIT = 20;
const NOTE_MAX = 500;
const selectClass = "h-10 rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring";

function processErrorMessage(error) {
    const data = error?.response?.data;
    return PROCESS_ERROR_COPY[data?.code] || data?.message || 'The withdrawal could not be processed. Please try again.';
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

    const [status, setStatus] = useState('requested');
    const [page, setPage] = useState(1);
    // A single dialog driven by { withdrawal, action } rather than two booleans,
    // so mark-paid and reject can never both be open and the busy state always
    // belongs to the row actually being processed.
    const [pending, setPending] = useState(null);

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
        mutationFn: async ({ id, action, note }) => {
            const path = action === 'paid' ? 'mark-paid' : 'reject';
            const res = await axiosSecure.post(`/admin/withdrawals/${id}/${path}`, note ? { note } : {});
            return res.data;
        },
        onSuccess: (result, variables) => {
            notify.success(variables.action === 'paid' ? 'Withdrawal recorded as paid.' : 'Withdrawal rejected.');
            setPending(null);
            // The whole admin namespace, not just this page: processing a row
            // changes which status buckets it belongs to, so every cached filter
            // combination is now stale.
            queryClient.invalidateQueries({ queryKey: walletKeys.adminAll });
        },
        onError: (mutationError) => {
            notify.error(processErrorMessage(mutationError));
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
                <Badge tone={STATUS_TONE[row.original.status] || 'neutral'}>
                    {STATUS_LABEL[row.original.status] || row.original.status}
                </Badge>
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
                <PageHeader eyebrow="Admin" title="Withdrawal Requests" />
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
                </div>
                <Badge tone={STATUS_TONE[withdrawal.status] || 'neutral'} className="shrink-0">
                    {STATUS_LABEL[withdrawal.status] || withdrawal.status}
                </Badge>
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
                    <dt className="text-ds-muted-foreground">Processed</dt>
                    <dd className="text-ds-foreground">
                        {withdrawal.processedAt ? formatAbsoluteDateTime(withdrawal.processedAt) : 'Not yet processed'}
                    </dd>
                </div>
            </dl>
            {withdrawal.status === 'requested' && (
                <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => setPending({ withdrawal, action: 'paid' })}><Check aria-hidden="true" />Mark paid</Button>
                    <Button variant="outline" size="sm" onClick={() => setPending({ withdrawal, action: 'rejected' })}><X aria-hidden="true" />Reject</Button>
                </div>
            )}
        </div>
    );

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Label htmlFor="withdrawal-status" className="sr-only">Filter by status</Label>
            <select
                id="withdrawal-status"
                value={status}
                onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                className={selectClass}
            >
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </div>
    );

    const isMarkPaid = pending?.action === 'paid';

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Admin"
                title="Withdrawal Requests"
                description={isInitialLoading ? 'Loading withdrawal requests...' : `${total} withdrawal${total === 1 ? '' : 's'} in this view`}
            />
            <AdminPageLead
                eyebrow="Technician payouts"
                title="Settle the money first, then record it here"
                description="Each row is a technician asking for a share of the receivable Sarabo already owes them. Marking one paid records a payout you have made yourself - it does not send any money."
                icon={Banknote}
                metric={isInitialLoading ? undefined : total}
                metricLabel="withdrawals"
            />
            <p className={cn("text-sm text-ds-muted-foreground transition-opacity", isFetching ? "opacity-100" : "opacity-0")} role="status" aria-live="polite">
                Updating results…
            </p>
            <AdminDataTable
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
                onPageChange={(index) => setPage(index + 1)}
                emptyState={
                    <EmptyState
                        icon={Banknote}
                        title={status === 'requested' ? 'Nothing awaiting processing' : 'No withdrawals here'}
                        description={status === 'requested'
                            ? 'Withdrawal requests appear here as technicians ask to be paid out.'
                            : 'No withdrawals match this filter.'}
                        action={status !== 'requested'
                            ? <Button variant="outline" size="sm" onClick={() => { setStatus('requested'); setPage(1); }}>Show awaiting processing</Button>
                            : undefined}
                    />
                }
            />

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(next) => { if (!next) setPending(null); }}
                title={isMarkPaid ? 'Record this payout as paid?' : 'Reject this withdrawal?'}
                description={pending
                    ? isMarkPaid
                        ? `This records that you have already paid ${formatMoney(pending.withdrawal.amount, pending.withdrawal.currency)} to ${pending.withdrawal.technicianEmail} outside Sarabo. It does not transfer any money. It cannot be undone.`
                        : `${formatMoney(pending.withdrawal.amount, pending.withdrawal.currency)} returns to ${pending.withdrawal.technicianEmail}'s available balance and they can request it again. It cannot be undone.`
                    : undefined}
                confirmLabel={isMarkPaid ? 'Record as paid' : 'Reject withdrawal'}
                destructive={!isMarkPaid}
                busy={processMutation.isPending}
                reason
                reasonLabel={isMarkPaid ? 'Payout note (optional)' : 'Reason (optional)'}
                reasonPlaceholder={isMarkPaid ? 'e.g. bKash reference, transfer date' : 'Why this request is being rejected'}
                validateReason={validateNote}
                onConfirm={(note) => processMutation.mutate({ id: pending.withdrawal.id, action: pending.action, note })}
            />
        </div>
    );
};

export default WithdrawalRequests;
