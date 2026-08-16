import { CircleCheckBig } from 'lucide-react';
import { cn } from '../../lib/utils';

const TONE_STYLES = {
    action: 'border-ds-warning/35 bg-ds-warning/5',
    info: 'border-ds-primary/25 bg-ds-primary/5',
    clear: 'border-ds-success/30 bg-ds-success/5',
};

function AdminPageLead({ eyebrow, title, description, icon, tone = 'info', metric, metricLabel }) {
    const LeadIcon = icon || CircleCheckBig;
    return (
        <section aria-labelledby="admin-page-lead-heading" className={cn('rounded-ds-lg border p-5 sm:p-6', TONE_STYLES[tone] || TONE_STYLES.info)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ds-background/75 text-ds-primary">
                        <LeadIcon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="ds-label text-ds-muted-foreground">{eyebrow}</p>
                        <h2 id="admin-page-lead-heading" className="mt-1 text-lg font-semibold tracking-tight text-ds-foreground sm:text-xl">{title}</h2>
                        <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">{description}</p>
                    </div>
                </div>
                {metric !== undefined && metric !== null && (
                    <div className="shrink-0 border-t border-ds-border pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                        <p className="text-2xl font-semibold tabular-nums text-ds-foreground">{metric}</p>
                        <p className="text-xs text-ds-muted-foreground">{metricLabel}</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export { AdminPageLead };
