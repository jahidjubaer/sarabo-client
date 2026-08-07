import { cn } from '../../lib/utils';

// Determinate progress bar. Kept dependency-free (no Radix) since the
// foundation only needs a value-driven fill. Exposes proper progressbar ARIA
// so screen readers announce completion, and clamps the value defensively.
function Progress({ className, value = 0, ...props }) {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn("relative h-2 w-full overflow-hidden rounded-ds-sm bg-ds-muted", className)}
            {...props}
        >
            <div className="h-full rounded-ds-sm bg-ds-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
    );
}

export { Progress };
