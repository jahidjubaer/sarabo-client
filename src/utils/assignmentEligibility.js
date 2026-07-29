// Client-side visibility heuristic only - the server
// (services/assignmentEligibility.js, and the guarded query inside
// assignRiderToParcel itself) remains authoritative and re-checks this at
// write time. The admin request list already receives a server-computed
// `canAssign` flag per row (see controllers/parcelController.js's
// getAdminParcels) - this mirror exists only for places that don't have
// that flag handy (e.g. a locally-cached row before refetch).
export function canAssignRequest(request) {
    const status = request?.deliveryStatus || 'pending-pickup';
    return status === 'pending-pickup' && !request?.riderEmail;
}
