import { formatMoney } from '../../utils/currency';
import { severityLabel, repairabilityLabel } from '../../utils/inspectionForm';
import { Badge } from '../ui/badge';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Read-only inspection render (Phase 6.4 Unit 4) redesigned in 7.6A. Shown to
// customer, admin, and assigned technician. internalNotes is rendered ONLY when
// the server actually included it (admin / assigned technician) - the client
// never decides visibility itself.
function formatEstimate(amount, currency) {
    if (typeof amount !== 'number') return 'Not provided';
    return formatMoney(amount, currency || 'BDT') || `${amount}`;
}

const InspectionSummary = ({ inspection }) => {
    if (!inspection || inspection.status !== 'submitted') return null;
    const { diagnosis, repairability, estimate, submittedAt } = inspection;
    const issues = diagnosis?.detectedIssues || [];

    return (
        <div className="space-y-4 text-sm">
            {submittedAt && <p className="text-xs text-ds-muted-foreground">Inspected on {formatAbsoluteDateTime(submittedAt)}</p>}

            <div>
                <h4 className="font-semibold text-ds-foreground">Diagnosis</h4>
                <p className="mt-1 whitespace-pre-line text-ds-foreground">{diagnosis?.summary}</p>
            </div>

            {issues.length > 0 && (
                <div>
                    <h4 className="font-semibold text-ds-foreground">Detected issues</h4>
                    <ul className="mt-1 space-y-2">
                        {issues.map((issue, index) => (
                            <li key={index} className="rounded-ds border border-ds-border bg-ds-muted/30 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-ds-foreground">{issue.label}</span>
                                    <Badge tone="outline">{severityLabel(issue.severity)}</Badge>
                                </div>
                                {issue.notes && <p className="mt-1 text-ds-muted-foreground">{issue.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h4 className="font-semibold text-ds-foreground">Repairability</h4>
                <p className="mt-1"><Badge tone="neutral">{repairabilityLabel(repairability?.decision)}</Badge></p>
                {repairability?.reason && <p className="mt-1 whitespace-pre-line text-ds-muted-foreground">{repairability.reason}</p>}
            </div>

            <div>
                <h4 className="font-semibold text-ds-foreground">Preliminary estimate</h4>
                <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <p className="text-ds-foreground"><span className="text-ds-muted-foreground">Labor:</span> {formatEstimate(estimate?.laborEstimate, estimate?.currency)}</p>
                    <p className="text-ds-foreground"><span className="text-ds-muted-foreground">Parts:</span> {formatEstimate(estimate?.partsEstimate, estimate?.currency)}</p>
                </div>
                <p className="mt-1 text-xs text-ds-muted-foreground">Preliminary estimate — the final repair quote may differ, and no payment is requested now.</p>
            </div>

            {inspection.internalNotes && (
                <div className="rounded-ds border border-ds-warning/30 bg-ds-warning/10 p-3">
                    <h4 className="font-semibold text-ds-foreground">Internal technician notes</h4>
                    <p className="mt-1 whitespace-pre-line text-ds-foreground">{inspection.internalNotes}</p>
                    <p className="mt-1 text-xs text-ds-muted-foreground">Visible to technicians and admins only — not shown to the customer.</p>
                </div>
            )}
        </div>
    );
};

export default InspectionSummary;
