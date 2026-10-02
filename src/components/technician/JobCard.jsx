import { Link } from 'react-router';
import { CalendarDays, Camera, Clock3, LogIn, MapPin, RotateCcw, Send, Sparkles, Users, Wrench } from 'lucide-react';
import CategoryImage from '../public/CategoryImage';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import { formatPickupDate, formatPickupSlot } from '../../utils/pickupSlots';
import { formatRelativeTime } from '../../utils/relativeTime';
import { offerState } from '../../utils/jobBoard';
import { BECOME_TECHNICIAN_ROUTE } from '../../utils/publicContent';
import { cn } from '../../lib/utils';

const DECLINE_REASON_COPY = {
    price: 'the estimate',
    inspection_fee: 'the inspection fee',
    other: 'your offer',
};

// A label laid over the photo; always text (+ icon), never colour alone.
function PhotoTag({ className, children }) {
    return (
        <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-micro font-bold shadow-sm backdrop-blur [&_svg]:size-3.5', className)}>
            {children}
        </span>
    );
}

const STATE_TAG = {
    pending: { label: 'Offer sent', className: 'bg-ds-success-subtle/95 text-ds-success-subtle-foreground' },
    'can-revise': { label: 'Offer rejected', className: 'bg-ds-attention-subtle/95 text-ds-attention-subtle-foreground' },
    closed: { label: 'Offer rejected', className: 'bg-ds-danger-subtle/95 text-ds-danger-subtle-foreground' },
};

// One job on the open jobs board. `mode`:
//   'technician' - full details, photos and the technician's own offer
//   'guest'      - signed out: a safe summary and "Sign in to apply"
//   'member'     - signed in but not a technician: "Become a technician"
function JobCard({ job, mode, onApply, onPhotos }) {
    const state = offerState(job.mine);
    const headingId = `job-${job.id}-title`;
    const title = `${humanizeSlug(job.repairSlug)}${job.brand ? ` · ${job.brand}` : ''}`;
    const tag = mode === 'technician' ? STATE_TAG[state] : null;

    return (
        <article
            aria-labelledby={headingId}
            className="group flex h-full flex-col overflow-hidden rounded-ds-xl border border-ds-border bg-ds-card transition-[box-shadow,border-color,transform] duration-300 hover:border-ds-primary/40 hover:shadow-xl motion-safe:hover:-translate-y-0.5"
        >
            <div className="relative">
                <CategoryImage slug={job.categorySlug} className="aspect-video w-full" />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-1.5 p-3">
                    <PhotoTag className="bg-ds-card/95 text-ds-foreground">{humanizeSlug(job.categorySlug)}</PhotoTag>
                    <div className="flex flex-wrap justify-end gap-1.5">
                        {job.reposted && <PhotoTag className="bg-ds-card/95 text-ds-foreground"><RotateCcw aria-hidden="true" />Reposted</PhotoTag>}
                        {job.invited && mode === 'technician' && <PhotoTag className="bg-ds-active-subtle/95 text-ds-active-subtle-foreground"><Sparkles aria-hidden="true" />Invited</PhotoTag>}
                        {tag && <PhotoTag className={tag.className}>{tag.label}</PhotoTag>}
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/70 to-transparent p-3 pt-10 text-white">
                    <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold">
                        <Users aria-hidden="true" className="size-4" />
                        {job.offers > 0 ? `${job.offers} offer${job.offers === 1 ? '' : 's'}` : 'No offers yet'}
                    </span>
                    {job.postedAt && (
                        <span className="inline-flex items-center gap-1 text-micro font-medium opacity-90">
                            <Clock3 aria-hidden="true" className="size-3.5" /><span className="sr-only">{job.reposted ? 'Reposted' : 'Posted'} </span>{formatRelativeTime(job.postedAt)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="space-y-1">
                    <h2 id={headingId} className="text-subhead text-ds-foreground">{title}</h2>
                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-body-sm text-ds-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="size-4" />{job.district}, {job.region}</span>
                        {job.pickupDate && (
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays aria-hidden="true" className="size-4" />
                                {job.pickupSlot ? formatPickupSlot(job.pickupSlot) : formatPickupDate(job.pickupDate)}
                            </span>
                        )}
                    </p>
                </div>

                {mode === 'technician' && job.problem && (
                    <p className="line-clamp-2 text-body-sm text-ds-foreground">“{job.problem}”</p>
                )}

                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <p className="text-micro font-semibold text-ds-muted-foreground">Usual price</p>
                        <p className="ds-numeric text-heading text-ds-foreground">{formatMoneyRange(job.priceMin, job.priceMax, job.currency)}</p>
                    </div>
                    {mode === 'technician' && (
                        <p className="ds-numeric text-micro text-ds-muted-foreground">Visit fee up to {formatMoney(job.maxInspectionFee, 'BDT')}</p>
                    )}
                </div>

                {mode === 'technician' && job.mine && state !== 'none' && (
                    <p className="rounded-ds-lg bg-ds-muted px-3 py-2 text-body-sm text-ds-muted-foreground">
                        Your offer <span className="ds-numeric font-semibold text-ds-foreground">{formatMoneyRange(job.mine.estimateMin, job.mine.estimateMax, 'BDT')}</span>
                        {' '}· fee <span className="ds-numeric font-semibold text-ds-foreground">{formatMoney(job.mine.inspectionFee, 'BDT')}</span>
                        {state === 'can-revise' && (
                            <span className="mt-1 block text-ds-attention-subtle-foreground">
                                The customer didn't agree with {DECLINE_REASON_COPY[job.mine.declineReason] || 'your offer'}. You can send one revised offer.
                                {job.mine.declineNote ? ` Their message: “${job.mine.declineNote}”` : ''}
                            </span>
                        )}
                        {state === 'closed' && <span className="mt-1 block">The customer rejected your revised offer.</span>}
                    </p>
                )}

                <div className="mt-auto flex gap-2 pt-1">
                    {mode === 'technician' && (
                        <>
                            {state !== 'closed' && (
                                <Button variant={state === 'pending' ? 'outline' : 'action'} className="flex-1" onClick={() => onApply(job)}>
                                    <Send aria-hidden="true" />
                                    {state === 'pending' ? 'Update offer' : state === 'can-revise' ? 'Send revised offer' : 'Send offer'}
                                </Button>
                            )}
                            {job.photoCount > 0 ? (
                                <Button variant="outline" className={state === 'closed' ? 'flex-1' : undefined} onClick={() => onPhotos(job)} aria-label={`View photos (${job.photoCount})`}>
                                    <Camera aria-hidden="true" />{state === 'closed' ? `Photos (${job.photoCount})` : job.photoCount}
                                </Button>
                            ) : state === 'closed' && (
                                <p className="flex-1 self-center text-center text-body-sm text-ds-muted-foreground">No photos added</p>
                            )}
                        </>
                    )}
                    {mode === 'guest' && (
                        <Link to="/login" state="/jobs" className={cn(buttonVariants({ variant: 'action' }), 'flex-1')}>
                            <LogIn aria-hidden="true" />Sign in to apply
                        </Link>
                    )}
                    {mode === 'member' && (
                        <Link to={BECOME_TECHNICIAN_ROUTE} className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
                            <Wrench aria-hidden="true" />Become a technician to apply
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}

export { JobCard };
