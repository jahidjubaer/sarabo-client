import { cn } from '../../lib/utils';

// Presentational divider. Decorative by default (aria-hidden) so it is skipped
// by assistive tech; pass decorative={false} to expose it as a semantic
// separator when it genuinely divides distinct regions.
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
    return (
        <div
            role={decorative ? "none" : "separator"}
            aria-orientation={decorative ? undefined : orientation}
            className={cn(
                "shrink-0 bg-ds-border",
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                className
            )}
            {...props}
        />
    );
}

export { Separator };
