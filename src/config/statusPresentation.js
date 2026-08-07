import {
    Clock, UserCheck, Truck, PackageCheck, ClipboardCheck, FileText,
    CircleCheckBig, CircleX, CreditCard, Wrench, BadgeCheck, Ban, CircleHelp,
} from 'lucide-react';

// Canonical, UI-only presentation for every repair-request lifecycle status
// (Phase 7.1). This is the single source of truth for how a raw backend
// status is shown to a human: a friendly `label`, a semantic `tone` (never a
// raw colour), and a `lucide` `icon`. It deliberately does NOT change any
// business meaning - the raw status strings and their workflow semantics are
// untouched; this only decides presentation.
//
// Labels intentionally match the existing src/utils/repairStatus.js wording so
// the redesigned surfaces read identically to the current ones during the
// page-by-page migration. Legacy pages keep using repairStatus.js /
// statusBadge.js until they are migrated; new surfaces consume this map via
// components/common/StatusBadge.jsx.
//
// Tones (from the design-system scale): neutral | info | warning | success |
// danger | accent. Meaning is always paired with the label text and an icon,
// so status is never conveyed by colour alone.
const STATUS_PRESENTATION = {
    'pending-pickup': { label: 'Request Submitted', tone: 'warning', icon: Clock },
    'driver_assigned': { label: 'Technician Assigned', tone: 'info', icon: UserCheck },
    'rider_arriving': { label: 'Technician On The Way', tone: 'accent', icon: Truck },
    'parcel_picked_up': { label: 'Device Collected', tone: 'accent', icon: PackageCheck },
    'inspection_completed': { label: 'Inspection Completed', tone: 'info', icon: ClipboardCheck },
    'quote_submitted': { label: 'Quote Sent', tone: 'warning', icon: FileText },
    'quote_approved': { label: 'Quote Approved', tone: 'success', icon: CircleCheckBig },
    'quote_rejected': { label: 'Quote Declined', tone: 'danger', icon: CircleX },
    'payment_completed': { label: 'Payment Completed', tone: 'info', icon: CreditCard },
    'repair_in_progress': { label: 'Repair In Progress', tone: 'accent', icon: Wrench },
    'repair_completed': { label: 'Repair Completed', tone: 'success', icon: BadgeCheck },
    'parcel_delivered': { label: 'Repair Completed', tone: 'success', icon: BadgeCheck },
    'cancelled': { label: 'Request Cancelled', tone: 'neutral', icon: Ban },
};

// A missing/unknown status is never shown raw - it collapses to a safe,
// neutral fallback. A missing status is treated as the initial stage, matching
// how the rest of the app defaults an absent deliveryStatus to pending-pickup.
const FALLBACK_PRESENTATION = { label: 'Unknown Status', tone: 'neutral', icon: CircleHelp };

export function getStatusPresentation(status) {
    if (!status) return STATUS_PRESENTATION['pending-pickup'];
    return STATUS_PRESENTATION[status] || FALLBACK_PRESENTATION;
}

export { STATUS_PRESENTATION, FALLBACK_PRESENTATION };
