import { motion as Motion, AnimatePresence } from 'motion/react';
import { SearchX } from 'lucide-react';
import { RequestListItem } from './RequestListItem';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';

// Renders the filtered request list as stacked cards with a subtle enter/exit
// stagger (reduced-motion honoured by the MotionConfig in the page). A
// filtered-empty result shows a distinct "no matching requests" state with a
// Clear filters action - never the first-time onboarding empty state.
function RequestList({ requests, onClearFilters, onCancel, onDelete, onPay, cancellingId, deletingId, payingId }) {
    if (!requests || requests.length === 0) {
        return (
            <EmptyState
                icon={SearchX}
                title="No matching requests"
                description="No requests match your search or filters right now."
                action={<Button variant="outline" size="sm" onClick={onClearFilters}>Clear filters</Button>}
            />
        );
    }

    return (
        <Motion.ul layout aria-label="Repair requests" className="space-y-3">
            <AnimatePresence initial={false}>
                {requests.map((request) => (
                    <Motion.li
                        key={request._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <RequestListItem
                            request={request}
                            onCancel={onCancel}
                            onDelete={onDelete}
                            onPay={onPay}
                            cancellingId={cancellingId}
                            deletingId={deletingId}
                            payingId={payingId}
                        />
                    </Motion.li>
                ))}
            </AnimatePresence>
        </Motion.ul>
    );
}

export { RequestList };
