import { FilterToolbar } from '../common/FilterToolbar';
import { JOB_GROUPS, JOB_GROUP_LABELS, JOB_SORT_OPTIONS } from '../../utils/technicianJobPresentation';

// Assigned jobs toolbar: the shared FilterToolbar with the technician's groups.
function TechnicianJobFilters({ search, onSearchChange, group, onGroupChange, sort, onSortChange, counts }) {
    return (
        <FilterToolbar
            search={search}
            onSearchChange={onSearchChange}
            searchLabel="Search jobs"
            searchPlaceholder="Search by device, tracking code or district"
            sort={sort}
            onSortChange={onSortChange}
            sortOptions={JOB_SORT_OPTIONS}
            group={group}
            onGroupChange={onGroupChange}
            groups={JOB_GROUPS}
            groupLabels={JOB_GROUP_LABELS}
            counts={counts}
            attentionGroup="needs-attention"
        />
    );
}

export { TechnicianJobFilters };
