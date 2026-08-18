import { Wrench, MapPin, BadgeCheck, Phone } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { useTechnicianProfile } from '../../../hooks/useTechnicianProfile';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';

// The technician's own professional record (Phase 9.2), from GET /technicians/me.
//
// EVERY VALUE HERE IS STORED DATA. Nothing is derived, averaged or invented -
// there is no rating, no completed-job count, no certification list and no
// years-of-experience figure beyond the one the technician entered themselves
// per specialisation. A field the record does not have renders as an explicit
// "not provided" rather than an empty space, because a blank row reads as a
// loading bug and quietly hides that the application is incomplete.

const STATUS_TONE = { approved: 'success', pending: 'warning', rejected: 'danger', suspended: 'danger' };
const STATUS_LABEL = { approved: 'Approved', pending: 'Awaiting review', rejected: 'Not approved', suspended: 'Suspended' };
const WORK_STATUS_LABEL = { available: 'Available for assignment', in_delivery: 'On an active repair' };

function Row({ label, value, muted }) {
    return (
        <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-sm text-ds-muted-foreground">{label}</dt>
            <dd className={muted ? 'text-sm italic text-ds-muted-foreground' : 'text-sm font-medium text-ds-foreground sm:text-right'}>
                {value}
            </dd>
        </div>
    );
}

// One row per stored specialisation. This is the only place experience years
// exist, and they are per-specialisation by design - there is no single
// "years of experience" number on the record, so none is displayed.
function ExpertiseList({ expertise }) {
    if (!expertise.length) {
        return (
            <p className="text-sm italic text-ds-muted-foreground">
                No specialisations recorded yet. Add them so you can be matched to repairs.
            </p>
        );
    }
    return (
        <ul className="space-y-3">
            {expertise.map((entry, index) => (
                <li key={`${entry.productCategorySlug}-${index}`} className="rounded-ds border border-ds-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ds-foreground">{humanizeSlug(entry.productCategorySlug)}</span>
                        {entry.level && <Badge tone="accent">{humanizeSlug(entry.level)}</Badge>}
                        {Number.isFinite(Number(entry.experienceYears)) && (
                            <span className="text-xs text-ds-muted-foreground">
                                {entry.experienceYears} yr{Number(entry.experienceYears) === 1 ? '' : 's'} experience
                            </span>
                        )}
                    </div>
                    {Array.isArray(entry.repairCategorySlugs) && entry.repairCategorySlugs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {entry.repairCategorySlugs.map((slug) => (
                                <Badge key={slug} tone="neutral">{humanizeSlug(slug)}</Badge>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

function TechnicianProfileCard({ role }) {
    const { data, isPending, isError, error } = useTechnicianProfile(role);

    if (role !== 'rider') return null;

    if (isPending) {
        return (
            <Card className="space-y-3 p-5 sm:p-6">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </Card>
        );
    }

    if (isError) {
        const notFound = error?.response?.status === 404;
        return (
            <Card className="p-5 sm:p-6">
                <h2 className="text-base font-semibold text-ds-foreground">Technician profile</h2>
                <p className="mt-1 text-sm text-ds-muted-foreground">
                    {notFound
                        ? 'No technician application record is linked to this account yet.'
                        : 'Your technician profile could not be loaded right now.'}
                </p>
            </Card>
        );
    }

    const expertise = Array.isArray(data.expertise) ? data.expertise : [];
    const serviceArea = [data.district, data.region].filter(Boolean).join(', ');

    return (
        <div className="space-y-4">
            <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                    <Wrench aria-hidden="true" className="size-4 text-ds-primary" />
                    <h2 className="text-base font-semibold text-ds-foreground">Professional information</h2>
                </div>
                <p className="mt-1 text-sm text-ds-muted-foreground">
                    The specialisations you recorded on your application. These decide which repairs you can be matched to.
                </p>
                <div className="mt-4">
                    <ExpertiseList expertise={expertise} />
                </div>
            </Card>

            <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-4 text-ds-primary" />
                    <h2 className="text-base font-semibold text-ds-foreground">Service information</h2>
                </div>
                <dl className="mt-3 divide-y divide-ds-border">
                    <Row
                        label="Service area"
                        value={serviceArea || 'Not provided'}
                        muted={!serviceArea}
                    />
                    <Row
                        label="Application status"
                        value={data.status
                            ? <Badge tone={STATUS_TONE[data.status] || 'neutral'}>{STATUS_LABEL[data.status] || data.status}</Badge>
                            : 'Not available'}
                        muted={!data.status}
                    />
                    {data.workStatus && (
                        <Row label="Current availability" value={WORK_STATUS_LABEL[data.workStatus] || data.workStatus} />
                    )}
                </dl>
            </Card>

            <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                    <BadgeCheck aria-hidden="true" className="size-4 text-ds-primary" />
                    <h2 className="text-base font-semibold text-ds-foreground">Application details</h2>
                </div>
                <dl className="mt-3 divide-y divide-ds-border">
                    <Row label="Name on application" value={data.name || 'Not provided'} muted={!data.name} />
                    <Row label="Email on application" value={data.email || 'Not provided'} muted={!data.email} />
                    <Row
                        label={<span className="inline-flex items-center gap-1.5"><Phone aria-hidden="true" className="size-3.5" />Phone</span>}
                        value={data.phone || 'Not provided'}
                        muted={!data.phone}
                    />
                    <Row label="Address" value={data.address || 'Not provided'} muted={!data.address} />
                </dl>
            </Card>
        </div>
    );
}

export default TechnicianProfileCard;
