import { motion as Motion, AnimatePresence } from 'motion/react';
import { SearchX } from 'lucide-react';
import { TechnicianJobItem } from './TechnicianJobItem';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';

// Filtered assigned-job list as stacked cards with a subtle enter/exit stagger
// (reduced-motion honoured by the page's MotionConfig). A filtered-empty result
// shows a distinct "no matching jobs" state with a Clear filters action.
function TechnicianJobList({ jobs, onClearFilters, onAdvance, pendingAction }) {
    if (!jobs || jobs.length === 0) {
        return (
            <EmptyState
                icon={SearchX}
                title="No matching jobs"
                description="No assigned jobs match your search or filters right now."
                action={<Button variant="outline" size="sm" onClick={onClearFilters}>Clear filters</Button>}
            />
        );
    }

    return (
        <Motion.ul layout className="space-y-3">
            <AnimatePresence initial={false}>
                {jobs.map((job) => (
                    <Motion.li
                        key={job._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <TechnicianJobItem job={job} onAdvance={onAdvance} pendingAction={pendingAction} />
                    </Motion.li>
                ))}
            </AnimatePresence>
        </Motion.ul>
    );
}

export { TechnicianJobList };
