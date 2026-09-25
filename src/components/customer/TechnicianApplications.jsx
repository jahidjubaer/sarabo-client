import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Briefcase, CheckCircle2, MapPin, Star, Wrench } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useRequestApplications, jobPortalKeys } from '../../hooks/useJobPortal';
import { acceptApplication } from '../../api/jobPortal';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import { notify } from '../../lib/notify';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';

const ERROR_COPY = {
    TECHNICIAN_BUSY: 'That technician is on another job right now. Choose another, or try again later.',
    TECHNICIAN_NOT_ELIGIBLE: 'That technician can no longer take this repair. Please choose another.',
    APPLICATION_NOT_PENDING: 'That application is no longer open.',
    JOB_NOT_OPEN: 'A technician has already been chosen for this request.',
};

function Stat({ icon, children }) {
    const StatIcon = icon;
    return <span className="inline-flex items-center gap-1"><StatIcon aria-hidden="true" className="size-3.5" />{children}</span>;
}

// The customer compares technicians' applications and chooses one
// (job-portal phase B). Shown on the customer's request while it is open.
function TechnicianApplications({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const { data, isPending } = useRequestApplications(request._id);
    const [choosing, setChoosing] = useState(null);

    const accept = useMutation({
        mutationFn: (application) => acceptApplication(axiosSecure, request._id, application.id),
        onSuccess: (result) => {
            setChoosing(null);
            queryClient.invalidateQueries({ queryKey: jobPortalKeys.applications(request._id) });
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            notify.success(`${result.technicianName || 'Your technician'} is booked for your pickup time.`);
        },
        onError: (error) => {
            setChoosing(null);
            queryClient.invalidateQueries({ queryKey: jobPortalKeys.applications(request._id) });
            notify.error(ERROR_COPY[error?.response?.data?.code] || 'That technician could not be booked. Please try again.');
        },
    });

    if (isPending) return <div className="space-y-3">{[0, 1].map((k) => <Skeleton key={k} className="h-28 w-full" />)}</div>;
    const pending = (data?.applications ?? []).filter((a) => a.status === 'pending');
    if (pending.length === 0) {
        return <p className="text-body-sm text-ds-muted-foreground">No technician has applied yet. You'll be notified when one does - most apply within a day.</p>;
    }

    return (
        <>
            <ul className="space-y-3" aria-label="Applications">
                {pending.map((application) => {
                    const t = application.technician;
                    return (
                        <li key={application.id} className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-1.5">
                                    <p className="font-semibold text-ds-foreground">{t.name}</p>
                                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-micro text-ds-muted-foreground">
                                        {t.averageRating !== null
                                            ? <Stat icon={Star}>{t.averageRating} ({t.reviewCount} review{t.reviewCount === 1 ? '' : 's'})</Stat>
                                            : <Stat icon={Star}>No reviews yet</Stat>}
                                        {t.level && <Stat icon={Award}>{humanizeSlug(t.level)}</Stat>}
                                        {Number.isFinite(t.experienceYears) && <Stat icon={Briefcase}>{t.experienceYears} yr{t.experienceYears === 1 ? '' : 's'}</Stat>}
                                        <Stat icon={Wrench}>{t.completedRepairs} repair{t.completedRepairs === 1 ? '' : 's'} done</Stat>
                                        {t.district && <Stat icon={MapPin}>{t.district}</Stat>}
                                    </p>
                                    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
                                        <div><dt className="inline text-ds-muted-foreground">Estimate </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoneyRange(application.estimateMin, application.estimateMax, 'BDT')}</dd></div>
                                        <div><dt className="inline text-ds-muted-foreground">Inspection fee </dt><dd className="ds-numeric inline font-semibold text-ds-foreground">{formatMoney(application.inspectionFee, 'BDT')}</dd></div>
                                    </dl>
                                    {application.note && <p className="text-body-sm text-ds-foreground">“{application.note}”</p>}
                                </div>
                                <Button variant="action" className="shrink-0" onClick={() => setChoosing(application)} disabled={accept.isPending}>
                                    <CheckCircle2 aria-hidden="true" /> Choose
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <ConfirmDialog
                open={Boolean(choosing)}
                onOpenChange={(open) => { if (!open) setChoosing(null); }}
                title={choosing ? `Choose ${choosing.technician.name}?` : ''}
                description="They will be booked for your pickup time and the other applications will be closed."
                summary={choosing ? (
                    <dl className="space-y-1 text-body-sm">
                        <div className="flex justify-between gap-3"><dt className="text-ds-muted-foreground">Estimate</dt><dd className="ds-numeric font-semibold">{formatMoneyRange(choosing.estimateMin, choosing.estimateMax, 'BDT')}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-ds-muted-foreground">Inspection fee</dt><dd className="ds-numeric font-semibold">{formatMoney(choosing.inspectionFee, 'BDT')}</dd></div>
                        <p className="pt-1 text-micro text-ds-muted-foreground">The final price is set after the technician inspects the device. The inspection fee counts toward it if you go ahead.</p>
                    </dl>
                ) : null}
                confirmLabel="Choose technician"
                busy={accept.isPending}
                busyLabel="Booking…"
                onConfirm={() => accept.mutate(choosing)}
            />
        </>
    );
}

export { TechnicianApplications };
