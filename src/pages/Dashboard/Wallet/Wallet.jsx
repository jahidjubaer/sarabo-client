import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, Clock, CircleCheck, Lock, Banknote, Percent } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { walletKeys } from '../../../hooks/walletKeys';
import { notify } from '../../../lib/notify';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable } from '../../../components/common/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';

// Technician wallet (Phase 9).
//
// EVERY NUMBER ON THIS PAGE COMES FROM THE SERVER. Balances, the commission
// rate, and each settlement's receivable are read straight from
// GET /technician/wallet and rendered - nothing is summed, derived or
// re-computed here. The amount validation below is a convenience so the
// technician gets an answer without a round trip; the server re-validates every
// request against its own figures and its answer is the one that counts.
//
// The money is deliberately called a "receivable", never profit: it is what
// Sarabo owes the technician for completed, customer-confirmed work, before any
// cost the technician carries themselves.

// Server error codes surfaced as sentences a technician can act on. Anything
// unmapped falls back to the server's own message rather than a generic string,
// so a new server-side rule is never silently swallowed.
const WITHDRAWAL_ERROR_COPY = {
    WITHDRAWAL_EXCEEDS_AVAILABLE: 'That is more than your available balance.',
    WITHDRAWAL_ALREADY_OPEN: 'You already have a withdrawal awaiting processing.',
    INVALID_WITHDRAWAL_AMOUNT: 'Enter a whole taka amount greater than zero.',
    INVALID_WITHDRAWAL: 'That withdrawal request was not accepted.',
};

function withdrawalErrorMessage(error) {
    const data = error?.response?.data;
    return WITHDRAWAL_ERROR_COPY[data?.code] || data?.message || 'Could not request the withdrawal. Please try again.';
}

const SETTLEMENT_TONE = { available: 'success', pending: 'info' };
const SETTLEMENT_LABEL = { available: 'Available', pending: 'Awaiting confirmation' };
const WITHDRAWAL_TONE = { requested: 'info', paid: 'success', rejected: 'danger' };
const WITHDRAWAL_LABEL = { requested: 'Requested', paid: 'Paid', rejected: 'Rejected' };

const Wallet = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState('');

    const { data, isPending, isPaused, isError, refetch } = useQuery({
        queryKey: walletKeys.technician(),
        queryFn: async () => {
            const res = await axiosSecure.get('/technician/wallet');
            return res.data;
        },
    });

    const requestWithdrawal = useMutation({
        mutationFn: (payload) => axiosSecure.post('/technician/withdrawals', payload),
        onSuccess: () => {
            setAmount('');
            setAmountError('');
            notify.success('Withdrawal requested. An admin will process it.');
            queryClient.invalidateQueries({ queryKey: walletKeys.technician() });
        },
        onError: (error) => {
            // Shown against the field as well as in a toast: the field is where
            // the technician is looking, the toast is what they notice.
            setAmountError(withdrawalErrorMessage(error));
            notify.error(withdrawalErrorMessage(error));
        },
    });

    const loading = isPending && !isPaused;
    const unavailable = isError || isPaused;

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Earnings" title="Wallet" description="What you have earned, what is ready to withdraw, and what has been paid out." />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading wallet">
                    {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-ds-lg" />)}
                </div>
                <Skeleton className="h-64 rounded-ds-lg" />
            </div>
        );
    }

    if (unavailable) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Earnings" title="Wallet" />
                <ErrorState
                    title="Wallet could not be loaded"
                    description="This looks temporary. Your balances are safe on the server — nothing here is stored on this device."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const currency = data.currency || 'BDT';
    const availableBalance = data.availableBalance ?? 0;
    const hasOpenWithdrawal = !!data.hasOpenWithdrawal;
    const commissionPercent = Math.round((data.commissionRate ?? 0) * 100);

    // Convenience only. The same three rules the server enforces, checked here
    // so a mistake is answered instantly instead of after a round trip.
    const validate = (raw) => {
        const trimmed = raw.trim();
        if (trimmed === '') return 'Enter an amount.';
        if (!/^\d+$/.test(trimmed)) return 'Enter a whole taka amount — no decimals.';
        const value = Number(trimmed);
        if (value <= 0) return 'Enter an amount greater than zero.';
        if (value > availableBalance) return `That is more than your available balance of ${formatMoney(availableBalance, currency)}.`;
        return '';
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (requestWithdrawal.isPending || hasOpenWithdrawal) return;
        const message = validate(amount);
        if (message) {
            setAmountError(message);
            return;
        }
        setAmountError('');
        requestWithdrawal.mutate({ amount: Number(amount.trim()) });
    };

    const settlementColumns = [
        {
            key: 'trackingId',
            header: 'Repair',
            cell: (row) => <span className="ds-numeric text-body-sm text-ds-foreground">{row.trackingId || '—'}</span>,
        },
        {
            key: 'repairSubtotal',
            header: 'Repair subtotal',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            cell: (row) => <span className="ds-numeric">{formatMoney(row.repairSubtotal, row.currency || currency)}</span>,
        },
        {
            key: 'platformCommission',
            header: `Platform commission (${commissionPercent}%)`,
            headClassName: 'text-right',
            cellClassName: 'text-right',
            cell: (row) => <span className="ds-numeric text-ds-muted-foreground">−{formatMoney(row.platformCommission, row.currency || currency)}</span>,
        },
        {
            key: 'technicianReceivable',
            header: 'Your receivable',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            cell: (row) => <span className="ds-numeric font-semibold text-ds-foreground">{formatMoney(row.technicianReceivable, row.currency || currency)}</span>,
        },
        {
            key: 'status',
            header: 'State',
            cell: (row) => (
                <Badge tone={SETTLEMENT_TONE[row.status] || 'neutral'}>
                    {SETTLEMENT_LABEL[row.status] || row.status}
                </Badge>
            ),
        },
    ];

    const withdrawalColumns = [
        {
            key: 'amount',
            header: 'Amount',
            cell: (row) => <span className="ds-numeric font-semibold text-ds-foreground">{formatMoney(row.amount, row.currency || currency)}</span>,
        },
        {
            key: 'requestedAt',
            header: 'Requested',
            cell: (row) => <span className="ds-numeric text-body-sm text-ds-muted-foreground">{row.requestedAt ? formatAbsoluteDateTime(row.requestedAt) : '—'}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => (
                <Badge tone={WITHDRAWAL_TONE[row.status] || 'neutral'}>
                    {WITHDRAWAL_LABEL[row.status] || row.status}
                </Badge>
            ),
        },
        {
            key: 'processedAt',
            header: 'Processed',
            // Only ever a real timestamp from the server - a still-open
            // withdrawal shows a dash rather than an invented date.
            cell: (row) => <span className="ds-numeric text-body-sm text-ds-muted-foreground">{row.processedAt ? formatAbsoluteDateTime(row.processedAt) : '—'}</span>,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Earnings"
                title="Wallet"
                description="What you have earned, what is ready to withdraw, and what has already been paid out."
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Pending"
                    value={formatMoney(data.pendingBalance ?? 0, currency)}
                    icon={Clock}
                    helper="Paid by the customer, waiting on their receipt confirmation"
                />
                <StatCard
                    label="Available"
                    value={formatMoney(availableBalance, currency)}
                    icon={CircleCheck}
                    helper="Ready to withdraw now"
                />
                <StatCard
                    label="Withdrawal pending"
                    value={formatMoney(data.reservedBalance ?? 0, currency)}
                    icon={Lock}
                    helper="Reserved by a withdrawal an admin has not processed yet"
                />
                <StatCard
                    label="Withdrawn"
                    value={formatMoney(data.withdrawnBalance ?? 0, currency)}
                    icon={Banknote}
                    helper="Paid out to you to date"
                />
            </div>

            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-subhead text-ds-foreground">
                        <Percent aria-hidden="true" className="size-4 shrink-0 text-ds-primary" />
                        Platform commission: {commissionPercent}%
                    </h2>
                    <p className="mt-2 max-w-prose text-body-sm text-ds-muted-foreground">
                        Sarabo takes {commissionPercent}% of each customer-approved repair subtotal — parts, labour and
                        any additional charges together. You receive the remaining {100 - commissionPercent}%. How you
                        split a quote between parts and labour never changes what you receive.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full shrink-0 sm:max-w-xs" noValidate>
                    <FormField
                        id="withdrawal-amount"
                        label="Request a withdrawal"
                        error={amountError}
                    >
                        <Input
                            id="withdrawal-amount"
                            inputMode="numeric"
                            value={amount}
                            onChange={(event) => { setAmount(event.target.value); if (amountError) setAmountError(''); }}
                            placeholder="0"
                            disabled={hasOpenWithdrawal || requestWithdrawal.isPending}
                            aria-invalid={!!amountError}
                            aria-describedby={amountError ? 'withdrawal-amount-error' : 'withdrawal-amount-max'}
                        />
                    </FormField>
                    <p id="withdrawal-amount-max" className="mt-1.5 text-micro text-ds-muted-foreground">
                        Maximum available: <span className="ds-numeric font-semibold text-ds-foreground">{formatMoney(availableBalance, currency)}</span>
                    </p>
                    <LoadingButton
                        type="submit"
                        variant="action"
                        className="mt-3 w-full"
                        loading={requestWithdrawal.isPending}
                        loadingText="Requesting…"
                        disabled={hasOpenWithdrawal || availableBalance <= 0}
                    >
                        Request withdrawal
                    </LoadingButton>
                    {hasOpenWithdrawal && (
                        <p role="status" className="mt-2 text-micro text-ds-muted-foreground">
                            You have a withdrawal of{' '}
                            <span className="ds-numeric font-semibold text-ds-foreground">
                                {formatMoney(data.openWithdrawal?.amount, currency)}
                            </span>{' '}
                            awaiting processing. You can request another once it is settled.
                        </p>
                    )}
                    {!hasOpenWithdrawal && availableBalance <= 0 && (
                        <p className="mt-2 text-micro text-ds-muted-foreground">
                            Nothing is available to withdraw yet. Repairs become available once the customer confirms
                            they have the device back.
                        </p>
                    )}
                </form>
            </Card>

            <section className="space-y-3">
                <h2 className="text-subhead text-ds-foreground">Recent settlements</h2>
                <DataTable
                    columns={settlementColumns}
                    data={data.settlements}
                    getRowKey={(row) => row.repairRequestId}
                    empty={(
                        <EmptyState
                            icon={WalletIcon}
                            title="No settlements yet"
                            description="A settlement is recorded when a customer pays for a repair you completed."
                            headingLevel={3}
                        />
                    )}
                />
            </section>

            <section className="space-y-3">
                <h2 className="text-subhead text-ds-foreground">Withdrawal history</h2>
                <DataTable
                    columns={withdrawalColumns}
                    data={data.withdrawals}
                    getRowKey={(row) => row.id}
                    empty={(
                        <EmptyState
                            icon={Banknote}
                            title="No withdrawals yet"
                            description="Once you have an available balance you can request a withdrawal above."
                            headingLevel={3}
                        />
                    )}
                />
            </section>
        </div>
    );
};

export default Wallet;
