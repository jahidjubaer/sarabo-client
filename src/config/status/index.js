import {
    Ban, CheckCircle2, CircleCheckBig, CircleX, Clock, Eye, EyeOff, Hourglass, Search, ShieldCheck, ShieldX,
} from 'lucide-react';
import { getStatusPresentation, getStatusTone } from '../statusPresentation';

// Status registry (redesign Phase 1). One place that decides how every stored
// status value is shown to a person: label, tone and icon, per domain. Pages
// never keep their own label/tone maps - they render <StatusBadge domain=… />.
//
// Presentation only: the raw values, their meaning and every workflow rule are
// untouched. An unknown value returns null, so the UI shows nothing rather than
// a raw internal string.
//
// `audience` overrides (customer | technician | admin) change the label and/or
// tone for the role looking at it. Amber `attention` is reserved for "you have
// to act", so the same row reads as waiting for one role and attention for
// another.

const DOMAINS = {
    payment: {
        paid: { label: 'Paid', tone: 'success', icon: CircleCheckBig },
        unpaid: { label: 'Unpaid', tone: 'waiting', icon: Clock },
    },
    settlement: {
        pending: { label: 'Awaiting confirmation', tone: 'waiting', icon: Hourglass },
        available: { label: 'Available', tone: 'success', icon: CircleCheckBig },
    },
    withdrawal: {
        requested: {
            label: 'Requested', tone: 'waiting', icon: Clock,
            audience: { admin: { label: 'Awaiting processing', tone: 'attention' } },
        },
        paid: { label: 'Paid', tone: 'success', icon: CircleCheckBig },
        rejected: { label: 'Rejected', tone: 'danger', icon: CircleX },
    },
    report: {
        open: {
            label: 'Open', tone: 'waiting', icon: Clock,
            audience: { admin: { tone: 'attention' } },
        },
        under_review: { label: 'Under review', tone: 'active', icon: Search },
        resolved: { label: 'Resolved', tone: 'success', icon: CheckCircle2 },
        dismissed: { label: 'Dismissed', tone: 'neutral', icon: Ban },
    },
    reviewVisibility: {
        visible: { label: 'Visible', tone: 'success', icon: Eye },
        hidden: { label: 'Hidden', tone: 'neutral', icon: EyeOff },
    },
    application: {
        pending: {
            label: 'Awaiting review', tone: 'waiting', icon: Hourglass,
            audience: { admin: { tone: 'attention' } },
        },
        approved: { label: 'Approved', tone: 'success', icon: ShieldCheck },
        rejected: { label: 'Not approved', tone: 'danger', icon: ShieldX },
        suspended: { label: 'Suspended', tone: 'danger', icon: ShieldX },
    },
};

export const STATUS_DOMAINS = Object.keys(DOMAINS).concat('repair');

// Resolve { label, tone, icon } for a value in a domain, or null if unknown.
// The repair domain delegates to config/statusPresentation.js, which already
// owns repair labels, icons and role copy.
export function getStatus(domain, value, audience) {
    if (domain === 'repair') {
        const presentation = getStatusPresentation(value);
        return { label: presentation.label, tone: getStatusTone(value, audience), icon: presentation.icon };
    }
    const entry = DOMAINS[domain]?.[value];
    if (!entry) return null;
    const override = audience ? entry.audience?.[audience] : undefined;
    return {
        label: override?.label ?? entry.label,
        tone: override?.tone ?? entry.tone,
        icon: entry.icon,
    };
}

// Label only, for places that need text (selects, toasts, captions).
export function getStatusLabel(domain, value, audience) {
    return getStatus(domain, value, audience)?.label ?? null;
}

// Options for a filter <Select>, in registry order.
export function getStatusOptions(domain, audience) {
    return Object.keys(DOMAINS[domain] ?? {}).map((value) => ({ value, label: getStatusLabel(domain, value, audience) }));
}
