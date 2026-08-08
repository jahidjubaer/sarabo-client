import { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { isWelcomeDismissed, dismissWelcome } from '../../utils/welcomePreference';

// Slim, dismissible first-visit welcome banner (Phase 7.10). Client-only
// preference (welcomePreference.js) - shown on the first public Home visit,
// hidden once dismissed, never synced to an account. Not a blocking modal.
// "How it works" is a same-page anchor to the existing section; the close
// button is labelled. Rendered only by Home, so it never appears in the
// dashboard.
const WelcomeBanner = () => {
    const [visible, setVisible] = useState(() => !isWelcomeDismissed());
    if (!visible) return null;

    const handleDismiss = () => {
        dismissWelcome();
        setVisible(false);
    };

    return (
        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-ds-lg border border-ds-border bg-ds-muted/40 p-4 sm:mx-6 sm:flex-row sm:items-center sm:justify-between lg:mx-8">
            <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-ds bg-ds-primary/10 text-ds-primary">
                    <Sparkles aria-hidden="true" className="size-4" />
                </span>
                <p className="text-sm text-ds-foreground">
                    <span className="font-semibold">New to Sarabo?</span>{' '}
                    <span className="text-ds-muted-foreground">See how the repair process works.</span>
                </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <a href="#how-it-works" onClick={handleDismiss} className="focus-ring inline-flex items-center gap-1 rounded-ds px-3 py-1.5 text-sm font-medium text-ds-primary hover:bg-ds-primary/10">
                    How it works <ArrowRight aria-hidden="true" className="size-4" />
                </a>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss welcome message"
                    className="focus-ring inline-flex size-8 items-center justify-center rounded-ds text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeBanner;
