import { cn } from '../../lib/utils';

// Low-level shimmer block. Structural skeletons (card/detail/table) compose
// these to approximate final content, so loading states preserve layout
// instead of collapsing to a spinner. `animate-pulse` is disabled under
// prefers-reduced-motion by the global rule in index.css.
function Skeleton({ className, ...props }) {
    return <div className={cn("animate-pulse rounded-ds-sm bg-ds-muted", className)} {...props} />;
}

export { Skeleton };
