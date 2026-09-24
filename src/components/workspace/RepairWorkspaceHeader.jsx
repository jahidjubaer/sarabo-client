import { Link } from 'react-router';
import { ArrowLeft, CalendarDays, Copy, MoreHorizontal } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { notify } from '../../lib/notify';

// Repair workspace header (Phase 3): back link, the device as the page title,
// the ONE status badge on the page, and a quiet meta line (category, tracking
// code with copy, request date). Secondary actions (public tracking, cancel)
// live in a "More" menu so they never compete with the next step below;
// `primaryAction` is only for the rare control that must stay visible.
//
//   menuItems: [{ label, icon, to } | { label, icon, onSelect, destructive, disabled }]
//
// Never shows schemaVersion, Mongo ids, technician ids or storage keys.
function RepairWorkspaceHeader({ request, backTo, backLabel, audience, primaryAction, menuItems = [] }) {
    const { device, category, brandModel } = getProductSummary(request);
    const trackingId = request.trackingId;

    const copyTrackingId = async () => {
        try {
            await navigator.clipboard.writeText(trackingId);
            notify.success('Tracking code copied.');
        } catch {
            notify.info(`Tracking code: ${trackingId}`);
        }
    };

    return (
        <header className="space-y-4">
            <Link to={backTo} className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-ds text-body-sm font-semibold text-ds-muted-foreground hover:text-ds-foreground">
                <ArrowLeft aria-hidden="true" className="size-4" />
                {backLabel}
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h1 id="page-title" tabIndex={-1} className="min-w-0 break-words text-title text-ds-foreground outline-none">{device}</h1>
                        <StatusBadge status={request.deliveryStatus || 'pending-pickup'} audience={audience} size="lg" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ds-muted-foreground">
                        {(category || brandModel) && <span>{[category, brandModel].filter(Boolean).join(' · ')}</span>}
                        {trackingId && (
                            <button
                                type="button"
                                onClick={copyTrackingId}
                                aria-label={`Copy tracking code ${trackingId}`}
                                className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-ds font-mono text-body-sm text-ds-foreground hover:text-ds-primary"
                            >
                                {trackingId}
                                <Copy aria-hidden="true" className="size-3.5 text-ds-muted-foreground" />
                            </button>
                        )}
                        {request.createdAt && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays aria-hidden="true" className="size-4" />
                                Requested {formatAbsoluteDateTime(request.createdAt)}
                            </span>
                        )}
                    </div>
                </div>

                {(primaryAction || menuItems.length > 0) && (
                    <div className="flex shrink-0 items-center gap-2">
                        {primaryAction}
                        {menuItems.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <MoreHorizontal aria-hidden="true" /> More
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        return item.to ? (
                                            <DropdownMenuItem key={item.label} asChild>
                                                <Link to={item.to}>{Icon ? <Icon aria-hidden="true" /> : null}{item.label}</Link>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                key={item.label}
                                                variant={item.destructive ? 'destructive' : undefined}
                                                disabled={item.disabled}
                                                onSelect={item.onSelect}
                                            >
                                                {Icon ? <Icon aria-hidden="true" /> : null}{item.label}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export { RepairWorkspaceHeader };
