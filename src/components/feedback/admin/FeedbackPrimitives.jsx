import { useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ErrorState } from '../../common/ErrorState';
import { REPORT_STATUSES, REVIEW_VISIBILITY, validFeedbackId } from '../../../utils/technicianFeedback';
import { useTechnicianDirectory } from '../../../hooks/useTechnicianDirectory';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { StatusBadge } from '../../common/StatusBadge';
import { Select } from '../../ui/select';

// Report status or review visibility, resolved through the status registry.
export function FeedbackBadge({ value }) {
    const domain = value in REPORT_STATUSES ? 'report' : value in REVIEW_VISIBILITY ? 'reviewVisibility' : null;
    if (!domain) return <Badge tone="neutral">Unknown state</Badge>;
    return <StatusBadge domain={domain} status={value} audience="admin" />;
}

export function FeedbackReference({ value }) {
    return <span className="break-all font-mono text-xs text-ds-muted-foreground">{value || 'Not recorded'}</span>;
}

// A technician's name with their reference underneath. Records only carry the
// id; the name comes from the admin technician list. If that list is not
// available (or the technician record is gone) the reference alone is shown,
// exactly as before.
export function TechnicianName({ id }) {
    const { byId } = useTechnicianDirectory();
    const technician = id ? byId.get(String(id)) : null;
    if (!technician) return <FeedbackReference value={id} />;
    return (
        <span className="block min-w-0">
            <span className="block truncate text-body-sm font-semibold text-ds-foreground">{technician.name || 'Unnamed technician'}</span>
            <span className="block truncate text-micro text-ds-muted-foreground">{technician.email}</span>
        </span>
    );
}

export function FeedbackDate({ value }) {
    return value ? <time dateTime={value} className="text-xs text-ds-muted-foreground">{formatAbsoluteDateTime(value)}</time> : <span className="text-xs text-ds-muted-foreground">Not recorded</span>;
}

export function FeedbackUnavailable({ query, title = 'Moderation data unavailable' }) {
    const client = useQueryClient();
    return <ErrorState title={title} description="This data could not be loaded. It is not an empty result. Check your connection and try again."
        onRetry={() => client.resetQueries({ queryKey: query.queryKey, exact: true })} />;
}

export function FeedbackRefreshState({ query }) {
    const client = useQueryClient();
    if (query.isError || query.fetchStatus === 'paused') return (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-ds border border-ds-border bg-ds-muted p-3 text-sm">
            <p className="min-w-0 flex-1">Showing previously loaded data. Refresh is unavailable; moderation actions will resume after recovery.</p>
            <Button variant="outline" size="sm" onClick={() => client.invalidateQueries({ queryKey: query.queryKey, exact: true })}>Retry refresh</Button>
        </div>
    );
    return query.isFetching ? <p role="status" className="text-sm text-ds-muted-foreground">Refreshing…</p> : null;
}

// Filters for the moderation lists. The technician is picked from the admin
// technician list; if that list can't be loaded, the old exact-id field is
// offered instead so filtering by technician still works.
export function FeedbackFilters({ kind, filters, onChange }) {
    const id = useId();
    const directory = useTechnicianDirectory();
    const [technician, setTechnician] = useState(filters.technicianId ?? '');
    const [error, setError] = useState('');
    const field = kind === 'reports' ? 'status' : 'visibility';
    const labels = kind === 'reports' ? REPORT_STATUSES : REVIEW_VISIBILITY;
    const hasFilters = !!(filters[field] || filters.technicianId);
    const selectedKnown = !filters.technicianId || directory.byId.has(filters.technicianId);
    return (
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[14rem_minmax(0,20rem)_auto] lg:items-end"
            onSubmit={(event) => {
                event.preventDefault();
                const value = technician.trim();
                if (value && !validFeedbackId(value)) { setError('Enter an exact 24-character lowercase Technician ID.'); return; }
                setError('');
                onChange({ ...filters, page: 1, technicianId: value || undefined });
            }}>
            <div className="space-y-1.5">
                <Label htmlFor={`${id}-state`}>{kind === 'reports' ? 'Report status' : 'Review visibility'}</Label>
                <Select id={`${id}-state`} value={filters[field] ?? ''}
                    onChange={(event) => onChange({ ...filters, page: 1, [field]: event.target.value || undefined })}>
                    <option value="">All</option>
                    {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
            </div>
            {directory.isReady ? (
                <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${id}-technician`}>Technician</Label>
                    <Select id={`${id}-technician`} value={filters.technicianId ?? ''}
                        onChange={(event) => onChange({ ...filters, page: 1, technicianId: event.target.value || undefined })}>
                        <option value="">All technicians</option>
                        {!selectedKnown && <option value={filters.technicianId}>Technician {filters.technicianId}</option>}
                        {directory.technicians.map((t) => <option key={t._id} value={t._id}>{t.name || 'Unnamed technician'}{t.email ? ` (${t.email})` : ''}</option>)}
                    </Select>
                </div>
            ) : (
                <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${id}-technician`}>Exact Technician ID (optional)</Label>
                    <div className="flex gap-2">
                        <Input id={`${id}-technician`} value={technician} onChange={(event) => { setTechnician(event.target.value); setError(''); }} maxLength={24}
                            autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={`${id}-help`} />
                        <Button type="submit" variant="outline">Apply</Button>
                    </div>
                    <p id={`${id}-help`} className={error ? 'text-xs text-ds-destructive' : 'text-xs text-ds-muted-foreground'}>{error || 'The technician list is unavailable, so enter the reference shown in a record.'}</p>
                </div>
            )}
            {hasFilters && (
                <Button type="button" variant="ghost" onClick={() => { setTechnician(''); setError(''); onChange({ page: 1, limit: 20 }); }}>Clear filters</Button>
            )}
        </form>
    );
}
