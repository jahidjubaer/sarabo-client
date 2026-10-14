import { Badge } from '../ui/badge';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { formatMoney } from '../../utils/currency';
import { claimStatus, kindLabel, reasonLabel } from '../../utils/warranty';

function Fact({ label, children }) {
    return (
        <div>
            <dt className="text-micro font-medium text-ds-muted-foreground">{label}</dt>
            <dd className="text-body-sm text-ds-foreground [overflow-wrap:anywhere]">{children}</dd>
        </div>
    );
}

function When({ value }) {
    return value ? <time dateTime={value}>{formatAbsoluteDateTime(value)}</time> : null;
}

// One warranty claim: what the customer reported and every step since, for
// whoever is looking (audience: customer | technician | admin). Actions for
// the viewer go in `children`, shown at the bottom.
function WarrantyClaimCard({ claim, audience, heading, children }) {
    const status = claimStatus(claim.status, audience);
    const { inspection, decision, review, rerepair, confirmation, refund } = claim;
    return (
        <article className="space-y-4 rounded-ds-lg border border-ds-border bg-ds-card p-4 sm:p-5">
            <header className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    {heading}
                    <p className="font-semibold text-ds-foreground">{kindLabel(claim.kind)}</p>
                    <p className="text-micro text-ds-muted-foreground">Opened <When value={claim.createdAt} /></p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
            </header>

            <p className="whitespace-pre-wrap text-body-sm text-ds-foreground [overflow-wrap:anywhere]">{claim.description}</p>

            {claim.photos?.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Photos sent with the claim">
                    {claim.photos.map((photo, index) => (
                        <li key={photo.id}>
                            {photo.url
                                ? <a href={photo.url} target="_blank" rel="noreferrer" className="focus-ring block rounded-ds">
                                    <img src={photo.url} alt={`Claim photo ${index + 1}`} className="size-20 rounded-ds border border-ds-border object-cover" loading="lazy" />
                                </a>
                                : <span className="flex size-20 items-center justify-center rounded-ds border border-dashed border-ds-border text-micro text-ds-muted-foreground">Photo unavailable</span>}
                        </li>
                    ))}
                </ul>
            )}

            <dl className="grid gap-3 sm:grid-cols-2">
                {inspection && (
                    <Fact label="Free re-inspection">
                        <When value={inspection.visitAt} />{inspection.note ? ` - ${inspection.note}` : ''}
                    </Fact>
                )}
                {decision && (
                    <Fact label="Technician's decision">
                        {decision.covered ? 'Covered' : `Not covered (${reasonLabel(decision.reason)})`}{decision.note ? ` - ${decision.note}` : ''}
                    </Fact>
                )}
                {review?.requestedAt && (
                    <Fact label="Admin review">
                        {review.decision
                            ? `${review.decision === 'overturn' ? 'Decision changed: covered' : 'Decision kept: not covered'} - ${review.note}`
                            : `Requested${review.customerNote ? `: "${review.customerNote}"` : ''}`}
                    </Fact>
                )}
                {rerepair && (
                    <Fact label="Re-repair">
                        {rerepair.outcome === 'fixed' ? 'Repaired again' : 'Could not be repaired again'}{rerepair.note ? ` - ${rerepair.note}` : ''}
                    </Fact>
                )}
                {confirmation && (
                    <Fact label="Customer's answer">
                        {confirmation.fixed ? 'Working now' : 'Still not working'}{confirmation.note ? ` - ${confirmation.note}` : ''}
                    </Fact>
                )}
                {refund && (
                    <Fact label="Refund">
                        <span className="ds-numeric">{formatMoney(refund.total, refund.currency || 'BDT')}</span>
                        {refund.refundedAt ? <> refunded <When value={refund.refundedAt} /></> : ' - being processed'}
                    </Fact>
                )}
                {claim.reviewDeadline && claim.canRequestReview && (
                    <Fact label="Ask for a review by"><When value={claim.reviewDeadline} /></Fact>
                )}
            </dl>

            {children ? <div className="flex flex-wrap gap-2 border-t border-ds-border pt-4">{children}</div> : null}
        </article>
    );
}

export { WarrantyClaimCard };
