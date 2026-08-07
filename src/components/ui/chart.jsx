import { ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

// Minimal shadcn-style chart composition on top of Recharts (Phase 7.5),
// wired to the `ds-` design tokens so charts read correctly in light AND dark
// mode. ChartContainer applies token colours to Recharts' axis/grid/legend
// internals and provides a responsive box; ChartTooltipContent is a themed
// tooltip. Series colours are passed by the caller as CSS-var token colours
// (see utils/adminPresentation.js#toneColorVar), so they follow the theme too.
function ChartContainer({ className, height = 260, children }) {
    return (
        <div
            className={cn(
                "w-full text-xs text-ds-foreground",
                "[&_.recharts-cartesian-axis-tick_text]:fill-ds-muted-foreground",
                "[&_.recharts-cartesian-axis-line]:stroke-ds-border",
                "[&_.recharts-cartesian-grid_line]:stroke-ds-border",
                "[&_.recharts-legend-item-text]:!text-ds-foreground",
                "[&_.recharts-tooltip-cursor]:fill-ds-muted/50",
                className
            )}
            style={{ height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
}

function ChartTooltipContent({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-ds border border-ds-border bg-ds-popover px-3 py-2 text-xs text-ds-popover-foreground shadow-md">
            {label ? <p className="mb-1 font-medium">{label}</p> : null}
            {payload.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: item.color || item.payload?.fill || 'var(--ds-primary)' }} />
                    {item.name ? <span className="text-ds-muted-foreground">{item.name}</span> : null}
                    <span className="ml-auto pl-3 font-medium tabular-nums">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

export { ChartContainer, ChartTooltipContent };
