export const adminReportKeys = {
    all: ['admin-technician-reports'],
    list: (uid, filters) => ['admin-technician-reports', uid, 'list', filters],
    detail: (uid, id) => ['admin-technician-reports', uid, 'detail', id],
};
export const adminReviewKeys = {
    all: ['admin-technician-reviews'],
    list: (uid, filters) => ['admin-technician-reviews', uid, 'list', filters],
};
export const technicianReviewKeys = {
    all: ['technician-reviews'],
    list: (uid, page, limit) => ['technician-reviews', uid, { page, limit }],
};

const technicianGenerations = new WeakMap();
export const technicianReviewGeneration = (client) => technicianGenerations.get(client) ?? 0;

export function clearTechnicianReviewCache(client) {
    technicianGenerations.set(client, technicianReviewGeneration(client) + 1);
    client.cancelQueries({ queryKey: technicianReviewKeys.all });
    client.removeQueries({ queryKey: technicianReviewKeys.all });
}

const generations = new WeakMap();
const writes = new WeakMap();
export const feedbackCacheGeneration = (client) => generations.get(client) ?? 0;
const isFeedback = (key) => [adminReportKeys.all[0], adminReviewKeys.all[0]].includes(key?.[0]);

export function feedbackWriteController(client) {
    const controller = new AbortController();
    if (!writes.has(client)) writes.set(client, new Set());
    writes.get(client).add(controller);
    return { signal: controller.signal, release: () => writes.get(client)?.delete(controller) };
}

export function clearAdminFeedbackCache(client) {
    // In-flight mutation callbacks from the previous authorization context must
    // not refresh private data, even if the same account signs in again.
    generations.set(client, feedbackCacheGeneration(client) + 1);
    for (const controller of writes.get(client) ?? []) controller.abort();
    writes.delete(client);
    for (const queryKey of [adminReportKeys.all, adminReviewKeys.all]) {
        client.cancelQueries({ queryKey });
        client.removeQueries({ queryKey });
    }
    for (const mutation of client.getMutationCache().getAll()) {
        if (isFeedback(mutation.options.mutationKey)) client.getMutationCache().remove(mutation);
    }
}

export function watchFeedbackRole(client, roleKey) {
    let previousRole = client.getQueryData(roleKey);
    return client.getQueryCache().subscribe((event) => {
        if (JSON.stringify(event.query.queryKey) !== JSON.stringify(roleKey)) return;
        const nextRole = event.type === 'removed' ? undefined : event.query.state.data;
        if (previousRole === 'admin' && nextRole !== 'admin') clearAdminFeedbackCache(client);
        if (previousRole === 'rider' && nextRole !== 'rider') clearTechnicianReviewCache(client);
        previousRole = nextRole;
    });
}
