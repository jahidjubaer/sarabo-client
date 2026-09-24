// Admin service catalogue (quick-wins phase). Admin-only server routes; the
// server validates every value and decides the pricing version.
export async function listAdminServiceDefinitions(axiosSecure) {
    return (await axiosSecure.get('/admin/service-definitions')).data;
}

export async function createServiceDefinition(axiosSecure, payload) {
    return (await axiosSecure.post('/admin/service-definitions', payload)).data;
}

export async function updateServiceDefinition(axiosSecure, id, { expectedUpdatedAt, changes, acknowledgeWaitingRequests }) {
    return (await axiosSecure.patch(`/admin/service-definitions/${id}`, {
        expectedUpdatedAt,
        changes,
        ...(acknowledgeWaitingRequests ? { acknowledgeWaitingRequests: true } : {}),
    })).data;
}
