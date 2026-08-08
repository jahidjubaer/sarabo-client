import { Smartphone, Wrench, MapPin } from 'lucide-react';
import EstimateCard from './EstimateCard';

// Read-only recap of what the customer is submitting / just submitted (Phase
// 6.4 Unit 3A, redesigned ds-* in 7.7). Built entirely from local form values
// via createRequestFlow.js#buildReviewModel and the already-fetched catalogue
// definition - never from the POST /parcels response (which only returns
// { acknowledged, insertedId }). Shows only human-friendly fields, never raw
// slugs and never every form key.
function Row({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-3">
            {Icon ? <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-muted-foreground" /> : null}
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">{label}</p>
                <div className="text-sm text-ds-foreground">{children}</div>
            </div>
        </div>
    );
}

const RepairRequestSummary = ({ review }) => {
    if (!review) return null;
    return (
        <div className="space-y-4 rounded-ds-lg border border-ds-border bg-ds-card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Row icon={Smartphone} label="Device">
                    <p className="font-medium">{review.productCategoryLabel || '—'}</p>
                    {review.deviceLabel && <p className="text-ds-muted-foreground">{review.deviceLabel}</p>}
                    {review.serialNumber && <p className="text-ds-muted-foreground">Serial: {review.serialNumber}</p>}
                </Row>

                <Row icon={Wrench} label="Repair">
                    <p className="font-medium">{review.serviceLabel || '—'}</p>
                    {review.estimateText && <p className="text-ds-muted-foreground">Estimated {review.estimateText}</p>}
                </Row>

                <Row icon={MapPin} label="Service location">
                    <p>{review.locationText || '—'}</p>
                </Row>

                <Row icon={Wrench} label="Issue">
                    <p className="whitespace-pre-line break-words">{review.issue || '—'}</p>
                </Row>
            </div>

            {review.definition && <EstimateCard definition={review.definition} />}
        </div>
    );
};

export default RepairRequestSummary;
