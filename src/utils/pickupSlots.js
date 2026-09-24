// Pickup scheduling helpers (pickup-scheduling phase). Mirrors the server's
// utils/pickupSlots.js rules for display only - the server decides which slots
// are open and re-checks every choice.

// Slot times are Bangladesh time. A slot id maps to its label.
export const PICKUP_SLOT_LABELS = {
    '10-12': '10:00 AM – 12:00 PM',
    '12-14': '12:00 PM – 2:00 PM',
    '14-16': '2:00 PM – 4:00 PM',
    '16-18': '4:00 PM – 6:00 PM',
};

// The pickup can be changed until the device is picked up.
export const PICKUP_CHANGEABLE_STATUSES = ['pending-pickup', 'assignment_pending', 'driver_assigned', 'rider_arriving'];

// A form value holding one choice: "YYYY-MM-DD|slotId".
export function encodePickupChoice(date, slotId) {
    return `${date}|${slotId}`;
}

export function parsePickupChoice(choice) {
    if (typeof choice !== 'string' || !choice.includes('|')) return null;
    const [date, slotId] = choice.split('|');
    return date && slotId ? { date, slotId } : null;
}

// "YYYY-MM-DD" is a calendar date, so it is formatted in UTC to stop the
// viewer's own timezone from shifting it to the day before.
export function formatPickupDate(date, { weekday = 'short' } = {}) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday, day: 'numeric', month: 'short' }).format(parsed);
}

// "Sun, 27 Sep · 10:00 AM – 12:00 PM", or '' when there is no slot.
export function formatPickupSlot(pickupSlot) {
    if (!pickupSlot || typeof pickupSlot.date !== 'string') return '';
    const date = formatPickupDate(pickupSlot.date);
    const time = PICKUP_SLOT_LABELS[pickupSlot.slotId];
    return [date, time].filter(Boolean).join(' · ');
}

export function formatPickupChoice(choice) {
    const parsed = parsePickupChoice(choice);
    return parsed ? formatPickupSlot(parsed) : '';
}

export function canChangePickup(request) {
    return request?.schemaVersion === 2 && PICKUP_CHANGEABLE_STATUSES.includes(request?.deliveryStatus || 'pending-pickup');
}

const PICKUP_ERROR_MESSAGES = {
    PICKUP_SLOT_FULL: 'That pickup time was just booked up. Please choose another.',
    PICKUP_SLOT_TOO_SOON: 'That pickup time has passed or starts too soon. Please choose a later one.',
    PICKUP_SLOT_TOO_FAR: 'Pickups can be booked up to 7 days ahead. Please choose an earlier day.',
    PICKUP_DAY_CLOSED: 'We do not collect on that day. Please choose another.',
    INVALID_PICKUP_SLOT: 'Please choose a pickup time.',
    PICKUP_NOT_RESCHEDULABLE: 'The pickup time can no longer be changed.',
};

// Codes that mean "the slot list is out of date - reload it".
export const STALE_PICKUP_CODES = ['PICKUP_SLOT_FULL', 'PICKUP_SLOT_TOO_SOON', 'PICKUP_SLOT_TOO_FAR', 'PICKUP_DAY_CLOSED'];

export function getPickupErrorMessage(error) {
    return PICKUP_ERROR_MESSAGES[error?.response?.data?.code] || null;
}
