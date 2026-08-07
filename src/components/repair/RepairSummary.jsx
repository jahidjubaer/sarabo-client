import RepairProgressTimeline from './RepairProgressTimeline';
import { Badge } from '../ui/badge';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Read-only completed-repair view (Phase 6.4 Unit 7) redesigned in 7.6A. Shown
// to everyone once the repair is completed. Evidence images use the server's
// short-lived signed read urls exactly as returned (memory-only, never
// persisted) - the client never sees a storageKey or bucket.
const RepairSummary = ({ repair }) => {
    const completion = repair?.completion;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge tone="success">Repair completed</Badge>
                {completion?.completedAt && <span className="text-sm text-ds-muted-foreground">on {formatAbsoluteDateTime(completion.completedAt)}</span>}
            </div>

            {completion?.summary && (
                <div>
                    <h4 className="text-sm font-semibold text-ds-foreground">Completion summary</h4>
                    <p className="whitespace-pre-line text-sm text-ds-muted-foreground">{completion.summary}</p>
                </div>
            )}

            {Array.isArray(completion?.evidenceImages) && completion.evidenceImages.length > 0 && (
                <div>
                    <h4 className="mb-2 text-sm font-semibold text-ds-foreground">Completion photos</h4>
                    <div className="flex flex-wrap gap-3">
                        {completion.evidenceImages.map((image) => (
                            <a key={image.imageId} href={image.url || undefined} target="_blank" rel="noreferrer" className="focus-ring block rounded-ds">
                                {image.url
                                    ? <img src={image.url} alt="Repair completion evidence" className="size-28 rounded-ds border border-ds-border object-cover" />
                                    : <span className="flex size-28 items-center justify-center rounded-ds border border-ds-border text-xs text-ds-muted-foreground">Unavailable</span>}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {Array.isArray(repair?.progressUpdates) && repair.progressUpdates.length > 0 && (
                <div>
                    <h4 className="mb-2 text-sm font-semibold text-ds-foreground">Progress history</h4>
                    <RepairProgressTimeline updates={repair.progressUpdates} />
                </div>
            )}
        </div>
    );
};

export default RepairSummary;
