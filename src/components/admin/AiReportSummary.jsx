import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListChecks, RefreshCw, Sparkles } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { getAiReportSummary, writeAiReportSummary } from '../../api/adminReports';
import { getAiHelperErrorMessage } from '../../api/aiHelper';
import { LoadingButton } from '../common/LoadingButton';
import { Skeleton } from '../ui/skeleton';

const summaryKeys = { range: (days) => ['admin-report-ai-summary', days] };

const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// "What happened and what to do": an AI paragraph written from the Reports
// page's own numbers (the server drops any sentence with a number that isn't
// in the report). Saved per period, so opening the page costs no AI call;
// the admin presses the button to write a fresh one.
function AiReportSummary({ days }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const saved = useQuery({
        queryKey: summaryKeys.range(days),
        queryFn: () => getAiReportSummary(axiosSecure, days),
        staleTime: 60 * 1000,
        retry: false,
    });
    const write = useMutation({
        mutationFn: () => writeAiReportSummary(axiosSecure, days),
        onSuccess: (summary) => queryClient.setQueryData(summaryKeys.range(days), summary),
    });
    const summary = saved.data;
    const busy = write.isPending;

    return (
        <section aria-labelledby="ai-summary-heading" className="rounded-ds-lg border border-ds-primary/30 bg-ds-primary/5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ds-primary text-ds-primary-foreground">
                        <Sparkles className="size-4" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                        <h2 id="ai-summary-heading" className="text-heading text-ds-foreground">AI summary</h2>
                        <p className="mt-0.5 text-body-sm text-ds-muted-foreground">
                            {summary ? `Last ${summary.days} days · written ${timeFormat.format(new Date(summary.generatedAt))}` : `What happened in the last ${days} days and what to do about it.`}
                        </p>
                    </div>
                </div>
                <LoadingButton type="button" variant={summary ? 'outline' : 'primary'} size="sm" loading={busy} loadingText="Writing…" onClick={() => write.mutate()} className="shrink-0">
                    {summary ? <><RefreshCw aria-hidden="true" /> Write again</> : <><Sparkles aria-hidden="true" /> Write summary</>}
                </LoadingButton>
            </div>

            <div className="mt-4" aria-live="polite">
                {saved.isPending && !saved.isPaused ? (
                    <Skeleton className="h-16 w-full" />
                ) : summary ? (
                    <div className={busy ? 'opacity-60' : undefined}>
                        <p className="text-body font-semibold text-ds-foreground">{summary.headline}</p>
                        {summary.highlights.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-ds-foreground">
                                {summary.highlights.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        )}
                        {summary.actions.length > 0 && (
                            <div className="mt-4">
                                <h3 className="flex items-center gap-1.5 text-body-sm font-semibold text-ds-foreground">
                                    <ListChecks aria-hidden="true" className="size-4" /> What to do
                                </h3>
                                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-body-sm text-ds-foreground">
                                    {summary.actions.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : null}
                {write.isError && <p role="alert" className="mt-3 text-body-sm text-ds-destructive">{getAiHelperErrorMessage(write.error)}</p>}
                <p className="mt-3 text-micro text-ds-muted-foreground">Written by AI (Google Gemini) from the numbers on this page. Check them before acting.</p>
            </div>
        </section>
    );
}

export { AiReportSummary };
