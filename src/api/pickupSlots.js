// Pickup scheduling (pickup-scheduling phase). Both routes need sign-in.
export async function getPickupSlots(axiosSecure, region) {
    return (await axiosSecure.get('/pickup-slots', { params: { region } })).data;
}

export async function reschedulePickup(axiosSecure, requestId, pickupSlot) {
    return (await axiosSecure.patch(`/repair-requests/${requestId}/pickup-slot`, { pickupSlot })).data;
}
