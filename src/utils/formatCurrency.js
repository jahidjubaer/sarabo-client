// Canonical MVP payment currency is USD (see sarabo-server's
// config/paymentConfig.js) - every displayed cost/amount in the app must be
// shown as a dollar figure, consistently, never taka/BDT/other wording.
export function formatCurrency(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '$0.00';
    return `$${value.toFixed(2)}`;
}
