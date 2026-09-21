import { useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ErrorState } from '../../common/ErrorState';
import { REPORT_STATUSES, REVIEW_VISIBILITY, validFeedbackId } from '../../../utils/technicianFeedback';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';

export function FeedbackBadge({ value }) {
    const tone = { open: 'info', under_review: 'accent', resolved: 'success', dismissed: 'neutral', visible: 'success', hidden: 'neutral' }[value] ?? 'neutral';
    return <Badge tone={tone}>{REPORT_STATUSES[value] ?? REVIEW_VISIBILITY[value] ?? 'Unknown state'}</Badge>;
}

export function FeedbackReference({ value }) {
    return <span className="break-all font-mono text-xs text-ds-muted-foreground">{value || 'Not recorded'}</span>;
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

export function FeedbackFilters({ kind, filters, onChange }) {
    const id = useId();
    const [technician, setTechnician] = useState(filters.technicianId ?? '');
    const [error, setError] = useState('');
    const field = kind === 'reports' ? 'status' : 'visibility';
    const labels = kind === 'reports' ? REPORT_STATUSES : REVIEW_VISIBILITY;
    return (
        <form className="grid gap-3 rounded-ds-lg border border-ds-border bg-ds-card p-4 sm:grid-cols-2 xl:grid-cols-[1fr_2fr_auto_auto] xl:items-end"
            onSubmit={(event) => {
                event.preventDefault();
                const value = technician.trim();
                if (value && !validFeedbackId(value)) { setError('Enter an exact 24-character lowercase Technician ID.'); return; }
                setError('');
                onChange({ ...filters, page: 1, technicianId: value || undefined });
            }}>
            <div className="space-y-1.5">
                <Label htmlFor={`${id}-state`}>{kind === 'reports' ? 'Report status' : 'Review visibility'}</Label>
                <select id={`${id}-state`} value={filters[field] ?? ''} className="focus-ring h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 text-sm"
                    onChange={(event) => onChange({ ...filters, page: 1, [field]: event.target.value || undefined })}>
                    <option value="">All</option>
                    {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>
            <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${id}-technician`}>Exact Technician ID (optional)</Label>
                <Input id={`${id}-technician`} value={technician} onChange={(event) => { setTechnician(event.target.value); setError(''); }} maxLength={24}
                    autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={`${id}-help`} />
                <p id={`${id}-help`} className={error ? 'text-xs text-ds-destructive' : 'text-xs text-ds-muted-foreground'}>{error || 'Use the Technician reference shown in a record. No complaint-text search.'}</p>
            </div>
            <Button type="submit" variant="outline">Apply Technician filter</Button>
            <Button type="button" variant="ghost" onClick={() => { setTechnician(''); setError(''); onChange({ page: 1, limit: 20 }); }}>Clear filters</Button>
        </form>
    );
}
