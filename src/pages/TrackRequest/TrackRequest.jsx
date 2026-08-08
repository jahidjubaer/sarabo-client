import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, CircleCheck } from 'lucide-react';
import useAxios from '../../hooks/useAxios';
import Loading from '../../components/Loading/Loading';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { LoadingButton } from '../../components/common/LoadingButton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import {
    buildPublicTrackingModel, getTrackingErrorCopy, isValidTrackingCode,
} from '../../utils/trackingPresentation';

// Public repair tracking (Phase 7.9, redesigned ds-*). SECURITY UNCHANGED: this
// stays the unauthenticated, sanitized contract (GET /public/trackings/:code) -
// never the private dashboard logs endpoint. Query key, retry:false, the client
// tracking-code format guard, and the returned fields are all preserved; the
// view model is built by an explicit whitelist (trackingPresentation.js) so no
// customer/email/address/technician/quote/payment field can ever be rendered.
const TrackRequest = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const axiosInstance = useAxios();
    const [codeInput, setCodeInput] = useState('');
    const [formError, setFormError] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-tracking', requestId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/public/trackings/${encodeURIComponent(requestId)}`);
            return res.data;
        },
        enabled: !!requestId,
        retry: false,
    });

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

    const SearchCard = (
        <form onSubmit={handleSubmit} className="rounded-ds-lg border border-ds-border bg-ds-card p-5">
            <Label htmlFor="tracking-code">Tracking code</Label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <Input
                    id="tracking-code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="e.g. SRB-..."
                    aria-invalid={formError ? 'true' : 'false'}
                    className="sm:flex-1"
                />
                <LoadingButton type="submit" className="shrink-0">
                    <Search aria-hidden="true" /> Track repair
                </LoadingButton>
            </div>
            {formError && <p role="alert" className="mt-2 text-xs font-medium text-ds-destructive">{formError}</p>}
        </form>
    );

    // Initial/instructions state - no tracking code in the URL yet.
    if (!requestId) {
        return (
            <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
                <h1 className="text-2xl font-bold tracking-tight text-ds-foreground sm:text-3xl">Track repair</h1>
                <p className="mt-2 text-sm text-ds-muted-foreground">Enter your tracking code to see your repair progress.</p>
                <div className="mt-6">{SearchCard}</div>
            </div>
        );
    }

    if (isLoading) return <Loading />;

    if (error) {
        const { title, message } = getTrackingErrorCopy(error);
        return (
            <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
                <h1 className="text-2xl font-bold tracking-tight text-ds-foreground sm:text-3xl">Track repair</h1>
                <div className="mt-6"><ErrorState title={title} description={message} onRetry={() => navigate('/track-request')} retryLabel="Try another code" /></div>
            </div>
        );
    }

    const model = buildPublicTrackingModel(data);

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <h1 className="text-2xl font-bold tracking-tight text-ds-foreground sm:text-3xl">Track repair</h1>

            <div className="mt-6 rounded-ds-lg border border-ds-border bg-ds-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">Tracking code</p>
                        <p className="font-mono text-sm text-ds-foreground">{model.trackingCode || '—'}</p>
                    </div>
                    <Badge tone="info">{model.statusLabel}</Badge>
                </div>
                {model.updatedAt && (
                    <p className="mt-3 text-xs text-ds-muted-foreground">Last updated: {formatAbsoluteDateTime(model.updatedAt)}</p>
                )}
            </div>

            <h2 className="mt-8 text-base font-semibold text-ds-foreground">Repair progress</h2>
            {model.timeline.length === 0 ? (
                <p className="mt-3 rounded-ds-lg border border-dashed border-ds-border px-4 py-8 text-center text-sm text-ds-muted-foreground">
                    No status updates yet. Check back once your request is reviewed.
                </p>
            ) : (
                <ol className="mt-4 space-y-4">
                    {model.timeline.map((entry, i) => (
                        <li key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <CircleCheck aria-hidden="true" className="size-5 text-ds-primary" />
                                {i < model.timeline.length - 1 && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-ds-border" />}
                            </div>
                            <div className="pb-2">
                                <p className="text-sm font-medium text-ds-foreground">{entry.statusLabel}</p>
                                {entry.timestamp && <p className="text-xs text-ds-muted-foreground">{formatAbsoluteDateTime(entry.timestamp)}</p>}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

export default TrackRequest;
