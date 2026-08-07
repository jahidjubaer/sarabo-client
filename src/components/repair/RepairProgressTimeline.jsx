// Read-only repair progress timeline (Phase 6.4 Unit 7). Shown to the customer,
// admin, and assigned technician. Each update carries only a server-issued id,
// the message, and a server timestamp - never any rider identity.
function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

const RepairProgressTimeline = ({ updates }) => {
    if (!Array.isArray(updates) || updates.length === 0) {
        return <p className="opacity-70 text-sm">No progress updates yet.</p>;
    }
    return (
        <ul className="space-y-3">
            {updates.map((u) => (
                <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                    <p className="whitespace-pre-line">{u.message}</p>
                    <p className="text-xs opacity-60">{formatDate(u.createdAt)}</p>
                </li>
            ))}
        </ul>
    );
};

export default RepairProgressTimeline;
