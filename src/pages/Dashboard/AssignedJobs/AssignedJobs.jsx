import { useMemo, useState } from 'react';
import { useTechnicianJobs } from '../../../hooks/useTechnicianJobs';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { CardSkeleton } from '../../../components/common/Skeletons';
import { TechnicianJobFilters } from '../../../components/technician/TechnicianJobFilters';
import { TechnicianJobList } from '../../../components/technician/TechnicianJobList';
import { applyJobView, getJobGroup } from '../../../utils/technicianJobPresentation';

// Assigned Jobs (Phase 4): every job assigned to this technician, searchable,
// filterable by group (with counts) and sortable - most urgent first by
// default. Jobs, status advances and offer decisions all come from the shared
// useTechnicianJobs hook, which calls the existing endpoints unchanged.
// Search/filter/sort are pure client-side operations over the loaded list.
const AssignedJobs = () => {
    const { jobs, isInitialLoading, isUnavailableBeforeData, retry, pending, advance, accept, decline } = useTechnicianJobs();
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('all');
    const [sort, setSort] = useState('priority');

    const visibleJobs = useMemo(() => applyJobView(jobs, { search, group, sort }), [jobs, search, group, sort]);
    const counts = useMemo(() => jobs.reduce((totals, job) => {
        const key = getJobGroup(job);
        return { ...totals, [key]: (totals[key] || 0) + 1 };
    }, { all: jobs.length, 'needs-attention': 0, 'in-repair': 0, waiting: 0, completed: 0 }), [jobs]);

    const clearFilters = () => {
        setSearch('');
        setGroup('all');
        setSort('priority');
    };

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Assigned jobs" />
                <div className="space-y-3">{[0, 1, 2, 3].map((key) => <CardSkeleton key={key} className="h-24" />)}</div>
            </div>
        );
    }

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Assigned jobs" />
                <ErrorState title="Couldn't load your jobs" description="We couldn't load your assigned jobs right now. Please try again." onRetry={retry} />
            </div>
        );
    }

    const total = jobs.length;

    return (
        <div className="space-y-6">
            <PageHeader title="Assigned jobs" description={total === 0 ? 'No jobs assigned right now.' : `${total} job${total === 1 ? '' : 's'}`} />

            {total === 0 ? (
                <EmptyState title="No assigned jobs" description="New job offers will appear here for you to accept." />
            ) : (
                <>
                    <TechnicianJobFilters
                        search={search}
                        onSearchChange={setSearch}
                        group={group}
                        onGroupChange={setGroup}
                        sort={sort}
                        onSortChange={setSort}
                        counts={counts}
                    />
                    <p role="status" className="sr-only">{visibleJobs.length} of {total} jobs shown</p>
                    <TechnicianJobList
                        jobs={visibleJobs}
                        onClearFilters={clearFilters}
                        onAdvance={advance}
                        onAccept={accept}
                        onDecline={decline}
                        pending={pending}
                    />
                </>
            )}
        </div>
    );
};

export default AssignedJobs;
