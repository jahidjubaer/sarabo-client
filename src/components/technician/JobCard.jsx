import { useState } from 'react';
import { CalendarClock, Camera, MapPin, RotateCcw, Send, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import DamageImageManager from '../damage-images/DamageImageManager';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import { formatPickupSlot } from '../../utils/pickupSlots';
import { formatRelativeTime } from '../../utils/relativeTime';

const DECLINE_REASON_COPY = {
    price: 'the estimate',
    inspection_fee: 'the inspection fee',
    other: 'your offer',
};

// What the technician can do next with their own offer.
function offerState(mine) {
    if (!mine) return 'none';
    if (mine.status === 'pending') return 'pending';
    if (mine.status === 'declined') return mine.canReoffer ? 'can-revise' : 'closed';
    return 'none';
}

// One open job for a signed-in technician: full details, photos and their
// own offer (open jobs board).
function JobCard({ job, onApply }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const mine = job.myApplication;
    const state = offerState(mine);
    const headingId = `job-${job.id}-title`;
    return (
        <Card className="p-5" aria-labelledby={headingId}>
            <article className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-micro font-semibold text-ds-muted-foreground">{humanizeSlug(job.product.categorySlug)} · {humanizeSlug(job.repairCategorySlug)}</p>
                        <h2 id={headingId} className="text-subhead text-ds-foreground">{job.title}</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {job.reposted && <Badge tone="neutral"><RotateCcw aria-hidden="true" />Reposted</Badge>}
                        {job.invited && <Badge tone="info">Invited by Sarabo</Badge>}
                        {state === 'pending' && <Badge tone="success">{mine.revised ? 'Revised offer sent' : 'Applied'}</Badge>}
                        {state === 'can-revise' && <Badge tone="attention">Offer rejected</Badge>}
                        {state === 'closed' && <Badge tone="danger">Offer rejected</Badge>}
                        {job.otherApplications > 0 && <Badge tone="neutral"><Users aria-hidden="true" />{job.otherApplications} other{job.otherApplications === 1 ? '' : 's'} applied</Badge>}
                    </div>
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ds-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{job.district}, {job.region}</span>
                    {job.pickupSlot && <span className="inline-flex items-center gap-1.5"><CalendarClock aria-hidden="true" className="size-4" />Pickup {formatPickupSlot(job.pickupSlot)}</span>}
                    {job.postedAt && <span>{job.reposted ? 'Reposted' : 'Posted'} {formatRelativeTime(job.postedAt)}</span>}
                </p>
                {job.problem && <p className="text-body-sm text-ds-foreground">“{job.problem}”</p>}
                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm">
                    <div><dt className="inline text-ds-muted-foreground">Usual price </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(job.catalogueEstimate.min, job.catalogueEstimate.max, job.catalogueEstimate.currency)}</dd></div>
                    <div><dt className="inline text-ds-muted-foreground">Inspection fee up to </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoney(job.maxInspectionFee, 'BDT')}</dd></div>
                    {mine && state !== 'none' && (
                        <div><dt className="inline text-ds-muted-foreground">Your offer </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(mine.estimateMin, mine.estimateMax, 'BDT')} · fee {formatMoney(mine.inspectionFee, 'BDT')}</dd></div>
                    )}
                </dl>
                {state === 'can-revise' && (
                    <p className="rounded-ds-lg bg-ds-attention-subtle p-3 text-body-sm text-ds-attention-subtle-foreground">
                        The customer didn't agree with {DECLINE_REASON_COPY[mine.declineReason] || 'your offer'} and reposted the request. You can send one revised offer.
                        {mine.declineNote ? <span className="mt-1 block">Their message: “{mine.declineNote}”</span> : null}
                    </p>
                )}
                {state === 'closed' && (
                    <p className="text-body-sm text-ds-muted-foreground">The customer rejected your revised offer, so you can't send another for this job.</p>
                )}
                <div className="flex flex-wrap gap-2">
                    {state !== 'closed' && (
                        <Button variant={state === 'pending' ? 'outline' : 'action'} onClick={() => onApply(job)}>
                            <Send aria-hidden="true" /> {state === 'pending' ? 'Update or withdraw' : state === 'can-revise' ? 'Send revised offer' : 'Apply'}
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowPhotos((v) => !v)} aria-expanded={showPhotos}>
                        <Camera aria-hidden="true" /> {showPhotos ? 'Hide photos' : `View photos (${job.photoCount})`}
                    </Button>
                </div>
                {showPhotos && <div className="border-t border-ds-border pt-3"><DamageImageManager requestId={job.id} canEdit={false} /></div>}
            </article>
        </Card>
    );
}

export { JobCard };
