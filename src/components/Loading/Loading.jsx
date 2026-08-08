import { Loader2 } from 'lucide-react';

// Shared inline loading indicator (Phase 7.9: migrated to ds-*/Lucide so it is
// theme-reactive instead of a DaisyUI light island). A localized spinner with
// an accessible status role - not a full-screen takeover.
const Loading = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-ds-primary" aria-hidden="true" />
        <p className="text-sm text-ds-muted-foreground">Loading…</p>
    </div>
);

export default Loading;
