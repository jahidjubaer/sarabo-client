import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

// Compact metric tile: label, prominent value, optional leading icon and a
// helper/trend line. `trend` ('up' | 'down') only colours the helper text and
// adds a direction arrow - it never invents a value. Kept operational-sized
// (value at text-2xl), not a giant marketing number.
function StatCard({ label, value, icon: Icon, helper, trend, className }) {
    const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
    return (
        <Card className={cn("p-5", className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm text-ds-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold tracking-tight text-ds-foreground">{value}</p>
                </div>
                {Icon ? (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-ds bg-ds-muted text-ds-muted-foreground">
                        <Icon aria-hidden="true" className="size-5" />
                    </span>
                ) : null}
            </div>
            {helper ? (
                <p className={cn(
                    "mt-3 flex items-center gap-1 text-xs",
                    trend === 'up' ? "text-ds-success" : trend === 'down' ? "text-ds-destructive" : "text-ds-muted-foreground"
                )}>
                    {TrendIcon ? <TrendIcon aria-hidden="true" className="size-3.5" /> : null}
                    {helper}
                </p>
            ) : null}
        </Card>
    );
}

export { StatCard };
