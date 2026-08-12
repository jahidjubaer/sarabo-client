import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Read-only repair progress timeline (Phase 6.4 Unit 7) redesigned in 7.6A.
// Each update carries only a server id, the message, and a server timestamp -
// never any technician identity. Compact vertical list, no giant card per update.
const RepairProgressTimeline = ({ updates }) => {
    if (!Array.isArray(updates) || updates.length === 0) {
        return <p className="text-sm text-ds-muted-foreground">No progress updates yet.</p>;
    }
    return (
        <ul className="space-y-3">
            {updates.map((update) => (
                <li key={update.id} className="border-l-2 border-ds-primary/40 pl-3">
                    <p className="whitespace-pre-line text-sm text-ds-foreground">{update.message}</p>
                    <p className="text-xs text-ds-muted-foreground">{formatAbsoluteDateTime(update.createdAt)}</p>
                </li>
            ))}
        </ul>
    );
};

export default RepairProgressTimeline;
