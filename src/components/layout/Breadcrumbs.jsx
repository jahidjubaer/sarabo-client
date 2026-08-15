import { Link, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { SEGMENT_LABELS, DYNAMIC_SEGMENT_LABEL } from '../../config/dashboardNavigation';
import { cn } from '../../lib/utils';

// Route-aware breadcrumbs built purely from the current pathname + the known
// segment-label map. A segment with no mapped label is treated as a dynamic
// resource id and shown as a controlled generic label (never the raw Mongo id).
// No API calls are made for breadcrumb text in this unit.
function buildCrumbs(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    let acc = '';
    return parts.map((segment, index) => {
        acc += `/${segment}`;
        return {
            label: SEGMENT_LABELS[segment] || DYNAMIC_SEGMENT_LABEL,
            to: acc,
            isLast: index === parts.length - 1,
        };
    });
}

function Breadcrumbs({ className }) {
    const { pathname } = useLocation();
    const crumbs = buildCrumbs(pathname);
    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
            <ol className="flex items-center gap-1 text-body-sm">
                {crumbs.map((crumb, index) => (
                    <li
                        key={crumb.to}
                        // Below sm, only the current page is shown so the header never
                        // crowds the action controls; ancestors reappear from sm up.
                        className={cn("flex min-w-0 items-center gap-1", !crumb.isLast && "hidden sm:flex")}
                    >
                        {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-ds-muted-foreground" />}
                        {crumb.isLast ? (
                            <span aria-current="page" className="truncate font-semibold text-ds-foreground">{crumb.label}</span>
                        ) : (
                            <Link to={crumb.to} className="focus-ring truncate rounded-ds-sm text-ds-muted-foreground hover:text-ds-foreground">{crumb.label}</Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export { Breadcrumbs };
