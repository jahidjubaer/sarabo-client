import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Search, EyeOff, Clock } from 'lucide-react';
import useAxios from '../../hooks/useAxios';
import ServiceSpine from '../../components/spine/ServiceSpine';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { LoadingButton } from '../../components/common/LoadingButton';
import { ErrorState } from '../../components/common/ErrorState';
import { buttonVariants } from '../../components/ui/button-variants';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import {
    buildPublicTrackingModel, getTrackingErrorCopy, isValidTrackingCode,
} from '../../utils/trackingPresentation';

// Page frame, hoisted to module scope so it is a stable component type rather
// than one re-created on every render. The ink header is passed in, which keeps
// it identical across all four states - the page never reflows around the thing
// you came here to use.
function TrackShell({ header, children }) {
    return (
        <div className="mx-auto w-full max-w-5xl px-0 pb-16 sm:px-6 sm:pt-8 lg:px-8">
            {header}
            {children ? <div className="px-4 sm:px-0">{children}</div> : null}
        </div>
    );
}

// Public repair tracking (Phase 7.9, redesigned in Phase 4).
//
// SECURITY UNCHANGED: this stays the unauthenticated, sanitized contract
// (GET /public/trackings/:code) - never the private dashboard logs endpoint.
// The query key, retry:false, the client-side tracking-code format guard and
// the returned fields are all preserved. The view model is still built by the
// explicit whitelist in trackingPresentation.js, so no customer, technician,
// address, quote, payment or inspection field can reach this page - and the
// raw persisted status never leaves that module either. The spine below is
// rendered from the derived presentation model, not from a status string.
//
// Every timestamp shown is a real one from the response. Nothing is
// interpolated, and a stage with no event simply has no time against it.
const TrackRequest = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const axiosInstance = useAxios();
    const queryClient = useQueryClient();
    const [codeInput, setCodeInput] = useState('');
    const [formError, setFormError] = useState('');

    const { data, isPending, isPaused, isError, error } = useQuery({
        queryKey: ['public-tracking', requestId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/public/trackings/${encodeURIComponent(requestId)}`);
            return res.data;
        },
        enabled: !!requestId,
        retry: false,
    });

    const loading = isPending && !isPaused;
    const unavailable = isError || (isPaused && !data);
    const errorStatus = error?.response?.status;
    const retryUnavailable = isPaused || !errorStatus || errorStatus === 429 || errorStatus >= 500;
    const handleRetry = () => queryClient.resetQueries({ queryKey: ['public-tracking', requestId] });

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = codeInput.trim();
        if (!isValidTrackingCode(trimmed)) {
            setFormError('Enter a valid tracking code.');
            return;
        }
        setFormError('');
        navigate(`/track-request/${encodeURIComponent(trimmed)}`);
    };

    // The ink header is constant across all four states, so the page never
    // reflows around the thing you came here to use.
    const header = (
        <header className="tech-grid-pattern border border-ds-ink-foreground/15 bg-ds-ink px-6 py-12 text-ds-ink-foreground sm:rounded-ds-xl sm:px-10 lg:px-14">
            <p className="ds-label text-ds-action">Public tracking</p>
            <h1 className="mt-4 text-title text-ds-ink-foreground">Where is my device?</h1>
            <p className="mt-3 max-w-md text-body-sm text-ds-ink-foreground/70">
                Enter the tracking code from your request. No account needed.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 max-w-xl">
                <label htmlFor="tracking-code" className="sr-only">Tracking code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex h-12 flex-1 items-center gap-3 rounded-ds border border-ds-ink-foreground/25 bg-ds-ink-foreground/10 px-4 focus-within:border-ds-ink-foreground/50">
                        <Search aria-hidden="true" className="size-4 shrink-0 text-ds-ink-foreground/60" />
                        <input
                            id="tracking-code"
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            placeholder="e.g. SRB-..."
                            aria-invalid={formError ? 'true' : 'false'}
                            aria-describedby={formError ? 'tracking-code-error' : undefined}
                            className="ds-numeric w-full bg-transparent text-body-sm tracking-widest text-ds-ink-foreground placeholder:text-ds-ink-foreground/40 focus:outline-none"
                        />
                    </div>
                    <LoadingButton type="submit" variant="action" className="h-12 shrink-0">
                        Track repair
                    </LoadingButton>
                </div>
                {formError && (
                    <p id="tracking-code-error" role="alert" className="mt-2 text-micro font-semibold text-ds-action">
                        {formError}
                    </p>
                )}
            </form>
        </header>
    );

    // ---- 1. Empty: no code in the URL yet --------------------------------
    if (!requestId) {
        return (
            <TrackShell header={header}>
                <p className="mt-8 flex items-start gap-2.5 text-body-sm text-ds-muted-foreground">
                    <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    This is the public tracking view. Personal details are hidden.
                </p>
            </TrackShell>
        );
    }

    // ---- 2. Loading: reserve the result layout ---------------------------
    if (loading) {
        return (
            <TrackShell header={header}>
                <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading repair tracking">
                    <Skeleton className="h-80 rounded-ds-lg" />
                    <Skeleton className="h-48 rounded-ds-lg" />
                </div>
            </TrackShell>
        );
    }

    // ---- 3. Error --------------------------------------------------------
    if (unavailable) {
        const { title, message } = getTrackingErrorCopy(error);
        return (
            <TrackShell header={header}>
                <div className="mt-8">
                    <ErrorState
                        title={title}
                        description={message}
                        onRetry={retryUnavailable ? handleRetry : () => navigate('/track-request')}
                        retryLabel={retryUnavailable ? 'Try again' : 'Try another code'}
                    />
                </div>
            </TrackShell>
        );
    }

    // ---- 4. Result -------------------------------------------------------
    const model = buildPublicTrackingModel(data);

    // Tone follows the derived flow rather than being hard-coded to "info",
    // so a finished repair no longer reads the same as one in progress. It is
    // driven by presentation-safe flow state only - no status string involved -
    // and the badge always carries its label, so colour is never the signal.
    const BADGE_TONE = { complete: 'success', blocked: 'danger', cancelled: 'neutral', unknown: 'neutral' };
    const badgeTone = BADGE_TONE[model.spine.flow] || 'info';

    return (
        <TrackShell header={header}>
            <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="rounded-ds-lg border border-ds-border bg-ds-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-border px-6 py-5">
                        <div className="min-w-0">
                            <p className="ds-label text-ds-muted-foreground">Tracking code</p>
                            <p className="ds-numeric mt-1 text-subhead text-ds-foreground">{model.trackingCode || '—'}</p>
                        </div>
                        <Badge tone={badgeTone}>{model.statusLabel}</Badge>
                    </div>

                    <div className="px-6 py-6">
                        <p className="ds-label text-ds-muted-foreground">Progress</p>
                        <div className="mt-5">
                            <ServiceSpine model={model.spine} orientation="vertical" />
                        </div>
                    </div>

                    <div className="border-t border-ds-border px-6 py-6">
                        <h2 className="text-subhead text-ds-foreground">Updates</h2>
                        {model.timeline.length === 0 ? (
                            <p className="mt-3 rounded-ds border border-dashed border-ds-border px-4 py-8 text-center text-body-sm text-ds-muted-foreground">
                                No status updates yet. Check back once your request is reviewed.
                            </p>
                        ) : (
                            <ol className="mt-4 flex flex-col">
                                {model.timeline.map((entry, index) => (
                                    <li key={index} className="flex items-baseline justify-between gap-4 border-b border-ds-border/70 py-3 last:border-b-0">
                                        <span className="text-body-sm text-ds-foreground">{entry.statusLabel}</span>
                                        {entry.timestamp && (
                                            <time className="ds-numeric shrink-0 text-micro text-ds-muted-foreground">
                                                {formatAbsoluteDateTime(entry.timestamp)}
                                            </time>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                <aside className="flex flex-col gap-5">
                    <div className="rounded-ds-lg border border-ds-border bg-ds-card px-6 py-5">
                        <h2 className="ds-label text-ds-muted-foreground">This repair</h2>
                        <dl className="mt-4 flex flex-col gap-3">
                            {model.spine.counter && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-body-sm text-ds-muted-foreground">Stage</dt>
                                    <dd className="ds-numeric text-body-sm font-semibold text-ds-foreground">
                                        {model.spine.counter.current} of {model.spine.counter.total}
                                    </dd>
                                </div>
                            )}
                            {model.updatedAt && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="flex items-center gap-1.5 text-body-sm text-ds-muted-foreground">
                                        <Clock aria-hidden="true" className="size-3.5" /> Last update
                                    </dt>
                                    <dd className="ds-numeric text-body-sm text-ds-foreground">{formatAbsoluteDateTime(model.updatedAt)}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-ds-lg border border-ds-border bg-ds-accent/50 px-5 py-4 text-body-sm text-ds-accent-foreground">
                        <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="font-semibold">This is the public tracking view.</strong>{' '}
                            Personal details are hidden. Sign in to see the full record of your own repairs.
                        </span>
                    </div>

                    <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
                        Sign in to this repair
                    </Link>
                </aside>
            </div>
        </TrackShell>
    );
};

export default TrackRequest;
