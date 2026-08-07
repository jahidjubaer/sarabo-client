import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { JOB_GROUPS, JOB_GROUP_LABELS, JOB_SORT_OPTIONS } from '../../utils/technicianJobPresentation';

// Search + technician-friendly group filter + sort. All controls labelled; the
// group filter is a segmented button set with aria-pressed (not colour-only).
function TechnicianJobFilters({ search, onSearchChange, group, onGroupChange, sort, onSortChange }) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                    <Label htmlFor="job-search" className="sr-only">Search jobs</Label>
                    <Input
                        id="job-search"
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search by device, category, or location"
                        className="pl-9"
                    />
                </div>
                <div className="sm:w-48">
                    <Label htmlFor="job-sort" className="sr-only">Sort jobs</Label>
                    <select
                        id="job-sort"
                        value={sort}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring"
                    >
                        {JOB_SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div role="group" aria-label="Filter jobs by stage" className="flex flex-wrap gap-2">
                {JOB_GROUPS.map((groupKey) => (
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
                        {JOB_GROUP_LABELS[groupKey]}
                    </button>
                ))}
            </div>
        </div>
    );
}

export { TechnicianJobFilters };
