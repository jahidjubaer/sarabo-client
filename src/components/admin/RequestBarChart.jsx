import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';

// Horizontal "requests by ..." bar chart for the admin overview. Kept in its
// own module and loaded with React.lazy, so recharts (most of the admin home
// download) arrives after the page's numbers and lists are already on screen.
// Rows carrying their own `fill` are coloured per bar; otherwise every bar
// uses the primary colour.
function RequestBarChart({ data, labelWidth, height }) {
    const perBarColour = data.some((entry) => entry.fill);
    return (
        <ChartContainer height={height}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={labelWidth} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'var(--ds-muted)', opacity: 0.5 }} />
                <Bar
                    dataKey="value"
                    name="Requests"
                    radius={[0, 4, 4, 0]}
                    fill={perBarColour ? undefined : 'var(--ds-primary)'}
                    isAnimationActive={false}
                >
                    {perBarColour ? data.map((entry) => <Cell key={entry.key} fill={entry.fill} />) : null}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

export default RequestBarChart;
