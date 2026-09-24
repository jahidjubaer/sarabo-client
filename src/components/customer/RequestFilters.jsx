import { FilterToolbar } from '../common/FilterToolbar';
import { REQUEST_GROUPS, GROUP_LABELS, SORT_OPTIONS } from '../../utils/customerRequestPresentation';

// My repairs toolbar: the shared FilterToolbar with the customer's groups.
function RequestFilters({ search, onSearchChange, group, onGroupChange, sort, onSortChange, counts }) {
    return (
        <FilterToolbar
            search={search}
            onSearchChange={onSearchChange}
            searchLabel="Search requests"
            searchPlaceholder="Search by device or tracking code"
            sort={sort}
            onSortChange={onSortChange}
            sortOptions={SORT_OPTIONS}
            group={group}
            onGroupChange={onGroupChange}
            groups={REQUEST_GROUPS}
            groupLabels={GROUP_LABELS}
            counts={counts}
            attentionGroup="needs-action"
        />
    );
}

export { RequestFilters };
