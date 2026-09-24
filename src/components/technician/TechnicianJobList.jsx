import { SearchX } from 'lucide-react';
import { JobRow } from './JobRow';
import { OfferCard } from './OfferCard';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { getRequestStatus } from '../../utils/customerRequestPresentation';

// The filtered Assigned Jobs list. A new offer renders as an OfferCard with
// Accept / Decline inline; every other job as a JobRow. A filtered-empty result
// shows "no matching jobs" with Clear filters.
function TechnicianJobList({ jobs, onClearFilters, onAdvance, onAccept, onDecline, pending }) {
    if (!jobs || jobs.length === 0) {
        return (
            <EmptyState
                icon={SearchX}
                title="No matching jobs"
                description="No assigned jobs match your search or filters."
                action={<Button variant="outline" onClick={onClearFilters}>Clear filters</Button>}
            />
        );
    }

    return (
        <section aria-labelledby="assigned-job-results-heading">
            <h2 id="assigned-job-results-heading" className="sr-only">Assigned repair jobs</h2>
            <ul className="space-y-3">
                {jobs.map((job) => (
                    <li key={job._id}>
                        {getRequestStatus(job) === 'assignment_pending'
                            ? <OfferCard job={job} onAccept={onAccept} onDecline={onDecline} pending={pending} />
                            : <JobRow job={job} onAdvance={onAdvance} pending={pending} />}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export { TechnicianJobList };
