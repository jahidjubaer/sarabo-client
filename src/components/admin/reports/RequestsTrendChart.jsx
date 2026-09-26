import { useSyncExternalStore } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../../ui/chart';
import { formatReportDate, TREND_SERIES } from '../../../utils/reportPresentation';

// Names the line at its last point (direct label), in text ink - the short
// coloured stroke beside it carries the identity, not the text colour.
function endLabel({ name, lastIndex }) {
    return function renderLabel({ x, y, index }) {
        if (index !== lastIndex) return null;
        return (
            <text x={x + 8} y={y} dy={4} className="fill-ds-muted-foreground text-[11px] font-semibold">{name}</text>
        );
    };
}

const WIDE_QUERY = '(min-width: 640px)';
const subscribeWide = (onChange) => {
    const query = window.matchMedia(WIDE_QUERY);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
};
const isWide = () => window.matchMedia(WIDE_QUERY).matches;

// Requests made and repairs finished per day (reports phase). Loaded with
// React.lazy so recharts only downloads when the report is opened. On narrow
// screens the end-of-line labels are dropped so the lines get the width; the
// legend above the chart still names both.
function RequestsTrendChart({ data }) {
    const wide = useSyncExternalStore(subscribeWide, isWide, () => true);
    const lastIndex = data.length - 1;
    return (
        <ChartContainer height={260}>
            <LineChart data={data} margin={{ top: 8, right: wide ? 112 : 12, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatReportDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(date) => formatReportDate(date, { weekday: 'short' })}
                    cursor={{ stroke: 'var(--ds-border)', strokeWidth: 1 }}
                />
                {TREND_SERIES.map((series) => (
                    <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, stroke: 'var(--ds-card)', strokeWidth: 2 }}
                        isAnimationActive={false}
                        label={wide ? endLabel({ name: series.name, lastIndex }) : false}
                    />
                ))}
            </LineChart>
        </ChartContainer>
    );
}

export default RequestsTrendChart;
