import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, Clock, Lock, Banknote, ChevronDown } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { walletKeys } from '../../../hooks/walletKeys';
import { useTechnicianWallet } from '../../../hooks/useTechnicianWallet';
import { notify } from '../../../lib/notify';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { PageHeader } from '../../../components/common/PageHeader';
import { DataTable } from '../../../components/common/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { Card } from '../../../components/ui/card';
import { MoneyInput } from '../../../components/ui/money-input';
import { Skeleton } from '../../../components/ui/skeleton';
import { StatusBadge } from '../../../components/common/StatusBadge';

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


const Wallet = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState('');

    const { data, isPending, isPaused, isError, refetch } = useTechnicianWallet();

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
                <PageHeader title="Wallet" description="What you have earned, what is ready to withdraw, and what has been paid out." />
                <div className="space-y-4" aria-busy="true" aria-label="Loading wallet">
                    <Skeleton className="h-44 rounded-ds-xl" />
                    <div className="grid gap-3 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-ds-lg" />)}
                    </div>
                </div>
                <Skeleton className="h-64 rounded-ds-lg" />
            </div>
        );
    }

    if (unavailable) {
        return (
            <div className="space-y-6">
                <PageHeader title="Wallet" />
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
                <StatusBadge domain="settlement" status={row.status} audience="technician" />
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
                <StatusBadge domain="withdrawal" status={row.status} audience="technician" />
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
                title="Wallet"
                description="What you have earned, what is ready to withdraw, and what has already been paid out."
            />

            {/* Available is the number a technician opens this page for, so it
                leads, with the withdrawal form right beside it. */}
            <Card className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
                <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-ds-muted-foreground">Available to withdraw</p>
                    <p className="ds-numeric mt-1 text-display text-ds-foreground">{formatMoney(availableBalance, currency)}</p>
                    <p className="mt-2 max-w-prose text-body-sm text-ds-muted-foreground">
                        From repairs the customer has confirmed they received.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full rounded-ds-lg bg-ds-muted p-4" noValidate>
                    <FormField
                        id="withdrawal-amount"
                        label="Withdraw (BDT)"
                        error={amountError}
                    >
                        <MoneyInput
                            id="withdrawal-amount"
                            inputMode="numeric"
                            value={amount}
                            onChange={(event) => { setAmount(event.target.value); if (amountError) setAmountError(''); }}
                            placeholder="0"
                            disabled={hasOpenWithdrawal || requestWithdrawal.isPending}
                            aria-describedby="withdrawal-amount-max"
                        />
                    </FormField>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p id="withdrawal-amount-max" className="text-micro text-ds-muted-foreground">
                            Up to <span className="ds-numeric font-semibold text-ds-foreground">{formatMoney(availableBalance, currency)}</span>
                        </p>
                        {!hasOpenWithdrawal && availableBalance > 0 && (
                            <button
                                type="button"
                                onClick={() => { setAmount(String(availableBalance)); setAmountError(''); }}
                                className="focus-ring min-h-11 rounded-ds px-2 text-micro font-bold text-ds-primary hover:underline"
                            >
                                Withdraw all
                            </button>
                        )}
                    </div>
                    <LoadingButton
                        type="submit"
                        variant="action"
                        className="mt-2 w-full"
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
                            Nothing to withdraw yet. A repair becomes available once the customer confirms they have
                            the device back.
                        </p>
                    )}
                </form>
            </Card>

            <dl className="grid gap-3 sm:grid-cols-3">
                {[
                    { label: 'Pending', value: data.pendingBalance, icon: Clock, helper: 'Paid, waiting on the customer to confirm receipt' },
                    { label: 'Withdrawal in progress', value: data.reservedBalance, icon: Lock, helper: 'Requested, not yet processed by an admin' },
                    { label: 'Withdrawn to date', value: data.withdrawnBalance, icon: Banknote, helper: 'Already paid out to you' },
                ].map((tile) => {
                    const TileIcon = tile.icon;
                    return (
                        <div key={tile.label} className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                            <dt className="flex items-center gap-1.5 text-micro font-semibold text-ds-muted-foreground">
                                <TileIcon aria-hidden="true" className="size-3.5" />{tile.label}
                            </dt>
                            <dd className="ds-numeric mt-1 text-heading text-ds-foreground">{formatMoney(tile.value ?? 0, currency)}</dd>
                            <dd className="mt-0.5 text-micro text-ds-muted-foreground">{tile.helper}</dd>
                        </div>
                    );
                })}
            </dl>

            <details className="group rounded-ds-lg border border-ds-border bg-ds-card">
                <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-ds-lg px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="text-body-sm font-bold text-ds-foreground">
                        How your earnings are calculated
                        <span className="ml-2 font-normal text-ds-muted-foreground">{commissionPercent}% platform commission</span>
                    </span>
                    <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ds-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-prose border-t border-ds-border px-4 py-3 text-body-sm text-ds-muted-foreground">
                    Sarabo takes {commissionPercent}% of each customer-approved repair subtotal: parts, labour and
                    any additional charges together. You receive the remaining {100 - commissionPercent}%. How you
                    split a quote between parts and labour never changes what you receive.
                </p>
            </details>

            <section className="space-y-3">
                <h2 className="text-subhead text-ds-foreground">Recent settlements</h2>
                <DataTable
                    columns={settlementColumns}
                    data={data.settlements}
                    getRowKey={(row) => row.repairRequestId}
                    renderMobile={(row) => (
                        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ds-numeric text-body-sm text-ds-muted-foreground">{row.trackingId || '—'}</span>
                                <StatusBadge domain="settlement" status={row.status} audience="technician" />
                            </div>
                            <p className="ds-numeric mt-2 text-heading text-ds-foreground">{formatMoney(row.technicianReceivable, row.currency || currency)}</p>
                            <p className="ds-numeric mt-0.5 text-micro text-ds-muted-foreground">
                                {formatMoney(row.repairSubtotal, row.currency || currency)} subtotal − {formatMoney(row.platformCommission, row.currency || currency)} commission
                            </p>
                        </div>
                    )}
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
                    renderMobile={(row) => (
                        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="ds-numeric text-heading text-ds-foreground">{formatMoney(row.amount, row.currency || currency)}</p>
                                <StatusBadge domain="withdrawal" status={row.status} audience="technician" />
                            </div>
                            <p className="ds-numeric mt-1 text-micro text-ds-muted-foreground">
                                Requested {row.requestedAt ? formatAbsoluteDateTime(row.requestedAt) : '—'}
                                {row.processedAt ? ` · Processed ${formatAbsoluteDateTime(row.processedAt)}` : ''}
                            </p>
                        </div>
                    )}
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
