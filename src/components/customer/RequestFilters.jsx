import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { cn } from '../../lib/utils';
import { REQUEST_GROUPS, GROUP_LABELS, SORT_OPTIONS } from '../../utils/customerRequestPresentation';

// Search + sort on one row, then the status groups as pills with counts.
// Pills are buttons with aria-pressed, so the active group is never conveyed by
// colour alone; counts come from the already-loaded list (never a false 0
// while loading - the page only renders this once the list is in).
function RequestFilters({ search, onSearchChange, group, onGroupChange, sort, onSortChange, counts = {} }) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                    <Label htmlFor="request-search" className="sr-only">Search requests</Label>
                    <Input
                        id="request-search"
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search by device or tracking code"
                        className="bg-ds-card pl-9"
                    />
                </div>
                <div className="sm:w-52">
                    <Label htmlFor="request-sort" className="sr-only">Sort requests</Label>
                    <Select id="request-sort" value={sort} onChange={(event) => onSortChange(event.target.value)} className="bg-ds-card">
                        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                </div>
            </div>

            <div role="group" aria-label="Filter by status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {REQUEST_GROUPS.map((groupKey) => {
                    const active = group === groupKey;
                    const count = counts[groupKey];
                    return (
                        <button
                            key={groupKey}
                            type="button"
                            onClick={() => onGroupChange(groupKey)}
                            aria-pressed={active}
                            className={cn(
                                'focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold transition-colors',
                                active
                                    ? 'border-ds-ink bg-ds-ink text-ds-ink-foreground'
                                    : 'border-ds-border bg-ds-card text-ds-muted-foreground hover:text-ds-foreground'
                            )}
                        >
                            {GROUP_LABELS[groupKey]}
                            {typeof count === 'number' && (
                                <span className={cn(
                                    'ds-numeric rounded-full px-1.5 text-micro font-bold',
                                    active ? 'bg-ds-ink-foreground/15' : groupKey === 'needs-action' && count > 0 ? 'bg-ds-attention-subtle text-ds-attention-subtle-foreground' : 'bg-ds-muted'
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { RequestFilters };
