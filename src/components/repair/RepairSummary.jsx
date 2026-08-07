import RepairProgressTimeline from './RepairProgressTimeline';

// Read-only completed-repair view (Phase 6.4 Unit 7). Shown to everyone once the
// repair is completed. Evidence images use the server's short-lived signed read
// urls exactly as returned (memory-only, never persisted) - the client never
// sees a storageKey or bucket.
function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

const RepairSummary = ({ repair }) => {
    const completion = repair?.completion;
    return (
        <div className="space-y-4">
            <p>
                <span className="badge badge-success">Repair completed</span>
                {completion?.completedAt && <span className="text-sm opacity-70 ml-2">on {formatDate(completion.completedAt)}</span>}
            </p>

            {completion?.summary && (
                <div>
                    <h4 className="font-semibold">Completion summary</h4>
                    <p className="text-sm opacity-80 whitespace-pre-line">{completion.summary}</p>
                </div>
            )}

            {Array.isArray(completion?.evidenceImages) && completion.evidenceImages.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Completion photos</h4>
                    <div className="flex flex-wrap gap-3">
                        {completion.evidenceImages.map((img) => (
                            <a key={img.imageId} href={img.url || undefined} target="_blank" rel="noreferrer" className="block">
                                {img.url
                                    ? <img src={img.url} alt="Repair completion evidence" className="w-28 h-28 object-cover rounded-lg border border-base-300" />
                                    : <span className="w-28 h-28 flex items-center justify-center text-xs opacity-60 rounded-lg border border-base-300">Unavailable</span>}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {Array.isArray(repair?.progressUpdates) && repair.progressUpdates.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Progress history</h4>
                    <RepairProgressTimeline updates={repair.progressUpdates} />
                </div>
            )}
        </div>
    );
};

export default RepairSummary;
