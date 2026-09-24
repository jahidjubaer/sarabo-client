import { useId } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { cn } from '../../lib/utils';

// The list toolbar shared by My repairs and Assigned jobs: search and sort on
// one row, then the groups as pills with counts. Pills are buttons with
// aria-pressed, so the active group is never conveyed by colour alone. Counts
// come from the already-loaded list. `attentionGroup` marks the pill whose
// count is a to-do, so a non-zero count there is highlighted.
function FilterToolbar({
    search, onSearchChange, searchLabel, searchPlaceholder,
    sort, onSortChange, sortOptions,
    group, onGroupChange, groups, groupLabels, counts = {}, attentionGroup,
}) {
    const id = useId();
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                    <Label htmlFor={`${id}-search`} className="sr-only">{searchLabel}</Label>
                    <Input
                        id={`${id}-search`}
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="bg-ds-card pl-9"
                    />
                </div>
                <div className="sm:w-52">
                    <Label htmlFor={`${id}-sort`} className="sr-only">Sort</Label>
                    <Select id={`${id}-sort`} value={sort} onChange={(event) => onSortChange(event.target.value)} className="bg-ds-card">
                        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                </div>
            </div>

            <div role="group" aria-label="Filter by status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {groups.map((groupKey) => {
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
                            {groupLabels[groupKey]}
                            {typeof count === 'number' && (
                                <span className={cn(
                                    'ds-numeric rounded-full px-1.5 text-micro font-bold',
                                    active ? 'bg-ds-ink-foreground/15' : groupKey === attentionGroup && count > 0 ? 'bg-ds-attention-subtle text-ds-attention-subtle-foreground' : 'bg-ds-muted'
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

export { FilterToolbar };
