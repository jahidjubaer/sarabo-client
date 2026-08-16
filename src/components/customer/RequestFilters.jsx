import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { REQUEST_GROUPS, GROUP_LABELS, SORT_OPTIONS } from '../../utils/customerRequestPresentation';

// Search + customer-friendly status group filter + sort. All controls are
// labelled; the group filter is a segmented set of buttons with aria-pressed so
// the active group is not conveyed by colour alone.
function RequestFilters({ search, onSearchChange, group, onGroupChange, sort, onSortChange }) {
    return (
        <section aria-labelledby="request-tools-heading" className="space-y-4 rounded-ds-lg border border-ds-border bg-ds-card p-4 sm:p-5">
            <div>
                <p className="ds-label text-ds-primary">Request history</p>
                <h2 id="request-tools-heading" className="mt-1 text-base font-semibold text-ds-foreground">Find a repair request</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                    <Label htmlFor="request-search" className="sr-only">Search requests</Label>
                    <Input
                        id="request-search"
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search by device, category, or tracking code"
                        className="pl-9"
                    />
                </div>
                <div className="sm:w-48">
                    <Label htmlFor="request-sort" className="sr-only">Sort requests</Label>
                    <select
                        id="request-sort"
                        value={sort}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
                {REQUEST_GROUPS.map((groupKey) => (
                    <button
                        key={groupKey}
                        type="button"
                        onClick={() => onGroupChange(groupKey)}
                        aria-pressed={group === groupKey}
                        className={cn(
                            "focus-ring rounded-ds-sm border px-3 py-1.5 text-sm font-medium transition-colors",
                            group === groupKey
                                ? "border-ds-primary bg-ds-primary/10 text-ds-primary"
                                : "border-ds-border text-ds-muted-foreground hover:bg-ds-muted"
                        )}
                    >
                        {GROUP_LABELS[groupKey]}
                    </button>
                ))}
            </div>
        </section>
    );
}

export { RequestFilters };
