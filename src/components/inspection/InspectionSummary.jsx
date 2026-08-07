import { formatMoney } from '../../utils/currency';
import { severityLabel, repairabilityLabel } from '../../utils/inspectionForm';

// Read-only inspection render (Phase 6.4 Unit 4 / Phase Y). Shown to the
// customer, admin, and assigned technician. internalNotes is rendered only
// when the server actually included it in the response (admin / assigned
// technician) - the client never decides visibility itself. No payment or
// quote-approval control is ever rendered here: an inspection estimate is a
// preliminary technician finding, explicitly not a final quote.
function formatEstimate(amount, currency) {
    if (typeof amount !== 'number') return 'Not provided';
    const formatted = formatMoney(amount, currency || 'BDT');
    return formatted || `${amount}`;
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

const SeverityBadge = ({ severity }) => (
    // Severity is conveyed by its text label, never by color alone.
    <span className="badge badge-outline">{severityLabel(severity)}</span>
);

const InspectionSummary = ({ inspection }) => {
    if (!inspection || inspection.status !== 'submitted') return null;

    const { diagnosis, repairability, estimate, submittedAt } = inspection;
    const issues = diagnosis?.detectedIssues || [];

    return (
        <div className="space-y-4">
            {submittedAt && <p className="text-sm opacity-70">Inspected on {formatDate(submittedAt)}</p>}

            <div>
                <h4 className="font-semibold">Diagnosis</h4>
                <p className="mt-1 whitespace-pre-line">{diagnosis?.summary}</p>
            </div>

            {issues.length > 0 && (
                <div>
                    <h4 className="font-semibold">Detected issues</h4>
                    <ul className="mt-1 space-y-2">
                        {issues.map((issue, index) => (
                            <li key={index} className="rounded-lg bg-base-200 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">{issue.label}</span>
                                    <SeverityBadge severity={issue.severity} />
                                </div>
                                {issue.notes && <p className="text-sm opacity-80 mt-1">{issue.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h4 className="font-semibold">Repairability</h4>
                <p className="mt-1"><span className="badge badge-neutral">{repairabilityLabel(repairability?.decision)}</span></p>
                {repairability?.reason && <p className="text-sm opacity-80 mt-1 whitespace-pre-line">{repairability.reason}</p>}
            </div>

            <div>
                <h4 className="font-semibold">Preliminary estimate</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <p><span className="opacity-70">Labor:</span> {formatEstimate(estimate?.laborEstimate, estimate?.currency)}</p>
                    <p><span className="opacity-70">Parts:</span> {formatEstimate(estimate?.partsEstimate, estimate?.currency)}</p>
                </div>
                <p className="text-sm opacity-70 mt-1">Preliminary estimate — the final repair quote may differ, and no payment is requested now.</p>
            </div>

            {inspection.internalNotes && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <h4 className="font-semibold">Internal technician notes</h4>
                    <p className="text-sm mt-1 whitespace-pre-line">{inspection.internalNotes}</p>
                    <p className="text-xs opacity-70 mt-1">Visible to technicians and admins only — not shown to the customer.</p>
                </div>
            )}
        </div>
    );
};

export default InspectionSummary;
