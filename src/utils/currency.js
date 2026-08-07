// Single shared currency formatter (Phase 6.4 Unit 3C / Phase K).
//
// Every price the app displays is denominated in whatever currency the
// server persisted for that record - it is NEVER converted here. The
// canonical service catalogue and every new repair-request pricing snapshot
// are now BDT (Bangladesh Taka); historical/legacy USD snapshots remain USD.
// This module only formats a value in its own stored currency, so a BDT
// estimate always renders as taka and a legacy USD amount always renders as
// dollars - no exchange rate, no relabelling, no floating-point FX math.
//
// Formatting is driven entirely by Intl.NumberFormat so we never hand-
// concatenate a "$" or "৳" symbol. BDT is shown with no fractional digits
// (whole taka - the catalogue prices carry no poisha); USD keeps the two
// decimal places the legacy payment flow has always shown.

const CURRENCY_FORMATS = {
    // narrowSymbol is what renders the actual taka glyph "৳" (the default
    // "symbol" display for BDT resolves to the literal text "BDT" in en
    // locales). Western digits + comma grouping come from the en-BD locale.
    BDT: { locale: 'en-BD', options: { style: 'currency', currency: 'BDT', maximumFractionDigits: 0, currencyDisplay: 'narrowSymbol' } },
    USD: { locale: 'en-US', options: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
};

// Accepts currency case-insensitively ("bdt"/"BDT", "usd"/"USD") and yields
// the uppercase ISO-style code Intl expects. A non-string is normalized to an
// empty code, which routes to the controlled fallback below.
function normalizeCurrencyCode(currency) {
    return typeof currency === 'string' ? currency.trim().toUpperCase() : '';
}

// Formats a single amount in its stored currency. Returns '' for a malformed
// (non-finite) amount so callers can decide their own placeholder text rather
// than showing a misleading "0". An unsupported currency code falls back to
// the numeric value followed by the uppercased code (e.g. "1500 EUR") - never
// a guessed symbol and never a conversion.
export function formatMoney(amount, currency) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '';

    const code = normalizeCurrencyCode(currency);
    const config = CURRENCY_FORMATS[code];
    if (config) {
        try {
            return new Intl.NumberFormat(config.locale, config.options).format(value);
        } catch {
            // Extremely old/limited Intl data - fall through to the plain fallback.
        }
    }

    const shown = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return code ? `${shown} ${code}` : shown;
}

// Formats an estimate range in a single currency, showing both endpoints
// clearly with a spaced en dash (e.g. "৳2,500 – ৳4,000"). Collapses to a
// single value when both endpoints format identically. Returns '' when either
// endpoint is malformed, so callers can fall back to their own copy.
export function formatMoneyRange(min, max, currency) {
    const low = formatMoney(min, currency);
    const high = formatMoney(max, currency);
    if (!low || !high) return '';
    return low === high ? low : `${low} – ${high}`;
}
