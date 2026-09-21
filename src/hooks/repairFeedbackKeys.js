// Customer feedback is private and separate from the Admin moderation caches.
export const repairFeedbackKeys = {
    all: ['repair-feedback'],
    request: (uid, requestId) => ['repair-feedback', uid, requestId],
};
const generations = new WeakMap();
const writes = new WeakMap();
export const repairFeedbackGeneration = (client) => generations.get(client) ?? 0;

export function repairFeedbackWriteController(client) {
    const controller = new AbortController();
    if (!writes.has(client)) writes.set(client, new Set());
    writes.get(client).add(controller);
    return { signal: controller.signal, release: () => writes.get(client)?.delete(controller) };
}

export function clearRepairFeedbackCache(client) {
    generations.set(client, repairFeedbackGeneration(client) + 1);
    for (const controller of writes.get(client) ?? []) controller.abort();
    writes.delete(client);
    client.cancelQueries({ queryKey: repairFeedbackKeys.all });
    client.removeQueries({ queryKey: repairFeedbackKeys.all });
    for (const mutation of client.getMutationCache().getAll()) {
        if (mutation.options.mutationKey?.[0] === repairFeedbackKeys.all[0]) client.getMutationCache().remove(mutation);
    }
}

export function watchRepairFeedbackRole(client, roleKey) {
    let previousRole = client.getQueryData(roleKey);
    return client.getQueryCache().subscribe((event) => {
        if (JSON.stringify(event.query.queryKey) !== JSON.stringify(roleKey)) return;
        const nextRole = event.type === 'removed' ? undefined : event.query.state.data;
        if (previousRole === 'user' && nextRole !== 'user') clearRepairFeedbackCache(client);
        previousRole = nextRole;
    });
}
