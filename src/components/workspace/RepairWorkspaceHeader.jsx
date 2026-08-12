import { Link } from 'react-router';
import { ArrowLeft, Package, CalendarDays } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Workspace header (Phase 7.6): back navigation + device identity + canonical
// status + request date + tracking id (already user-visible) + an optional
// role-relevant primary action slot. Never shows schemaVersion / Mongo ids /
// technician ids / storage keys.
function RepairWorkspaceHeader({ request, backTo, backLabel, action }) {
    const { device, category, brandModel } = getProductSummary(request);
    return (
        <div className="space-y-4">
            <Link to={backTo} className="focus-ring inline-flex items-center gap-1.5 rounded-ds text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground">
                <ArrowLeft aria-hidden="true" className="size-4" />
                {backLabel}
            </Link>
            <div className="flex flex-col gap-4 border-b border-ds-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ds-foreground sm:text-2xl">
                            <Package aria-hidden="true" className="size-5 shrink-0 text-ds-primary" />
                            <span className="truncate">{device}</span>
                        </h1>
                        <StatusBadge status={request.deliveryStatus || 'pending-pickup'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ds-muted-foreground">
                        {(category || brandModel) && <span className="truncate">{[category, brandModel].filter(Boolean).join(' · ')}</span>}
                        {request.createdAt && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays aria-hidden="true" className="size-4" />
                                {formatAbsoluteDateTime(request.createdAt)}
                            </span>
                        )}
                        {request.trackingId && <span className="font-mono text-xs">{request.trackingId}</span>}
                    </div>
                </div>
                {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
            </div>
        </div>
    );
}

export { RepairWorkspaceHeader };
