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
//
// `customerDescription` / `customerNextStep` (Phase 7.3) are PRESENTATION-ONLY,
// deterministic, plain-language copy for customer-facing surfaces - they never
// alter backend status semantics. `customerNextStep` is present only for the
// two states where the customer genuinely has an action to take (review a quote
// / complete payment); it is null everywhere else so the UI never invents a
// to-do. None of this copy exposes raw statuses, ids, or internal terminology.
const STATUS_PRESENTATION = {
    'pending-pickup': { label: 'Request Submitted', tone: 'warning', icon: Clock, customerDescription: "We've received your repair request and will assign a technician soon.", customerNextStep: null },
    'driver_assigned': { label: 'Technician Assigned', tone: 'info', icon: UserCheck, customerDescription: 'A technician has been assigned and will arrange to collect your device.', customerNextStep: null },
    'rider_arriving': { label: 'Technician On The Way', tone: 'accent', icon: Truck, customerDescription: 'Your technician is on the way to collect the device.', customerNextStep: null },
    'parcel_picked_up': { label: 'Device Collected', tone: 'accent', icon: PackageCheck, customerDescription: "We've received your device and will begin inspection shortly.", customerNextStep: null },
    'inspection_completed': { label: 'Inspection Completed', tone: 'info', icon: ClipboardCheck, customerDescription: 'Inspection is complete. A repair quote will follow shortly.', customerNextStep: null },
    'quote_submitted': { label: 'Quote Ready', tone: 'warning', icon: FileText, customerDescription: 'Your repair quote is ready to review.', customerNextStep: 'Review the quote and approve or decline it.' },
    'quote_approved': { label: 'Quote Approved', tone: 'success', icon: CircleCheckBig, customerDescription: "You've approved the quote for this repair.", customerNextStep: 'Complete payment to start the repair.' },
    'quote_rejected': { label: 'Quote Declined', tone: 'danger', icon: CircleX, customerDescription: 'You declined the repair quote for this request.', customerNextStep: null },
    'payment_completed': { label: 'Payment Completed', tone: 'info', icon: CreditCard, customerDescription: 'Payment received. Your repair will begin shortly.', customerNextStep: null },
    'repair_in_progress': { label: 'Repair In Progress', tone: 'accent', icon: Wrench, customerDescription: 'Your device is currently being repaired.', customerNextStep: null },
    'repair_completed': { label: 'Repair Completed', tone: 'success', icon: BadgeCheck, customerDescription: 'Your repair is complete.', customerNextStep: null },
    'parcel_delivered': { label: 'Repair Completed', tone: 'success', icon: BadgeCheck, customerDescription: 'Your repair is complete.', customerNextStep: null },
    'cancelled': { label: 'Request Cancelled', tone: 'neutral', icon: Ban, customerDescription: 'This request was cancelled.', customerNextStep: null },
};

// A missing/unknown status is never shown raw - it collapses to a safe,
// neutral fallback. A missing status is treated as the initial stage, matching
// how the rest of the app defaults an absent deliveryStatus to pending-pickup.
const FALLBACK_PRESENTATION = { label: 'Unknown Status', tone: 'neutral', icon: CircleHelp, customerDescription: '', customerNextStep: null };

export function getStatusPresentation(status) {
    if (!status) return STATUS_PRESENTATION['pending-pickup'];
    return STATUS_PRESENTATION[status] || FALLBACK_PRESENTATION;
}

export { STATUS_PRESENTATION, FALLBACK_PRESENTATION };
