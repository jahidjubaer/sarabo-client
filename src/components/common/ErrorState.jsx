import { TriangleAlert, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

// Reusable error surface with an optional Retry. It only ever renders the
// safe, human-readable strings the caller passes - never a raw Axios/Mongo/
// backend message - so mapping a caught error to a friendly description is the
// caller's responsibility (e.g. the existing *ErrorMessage helpers).
//
// `headingLevel` (Phase 13A) picks the heading ELEMENT only - the visual style
// is fixed, so changing it never changes how this looks. See EmptyState for the
// same reasoning: 2 is the default because the common case sits directly under
// the route's h1, where the previous hard-coded h3 skipped a level.
function ErrorState({
    title = 'Something went wrong',
    description = 'We could not load this right now. Please try again in a moment.',
    onRetry,
    retryLabel = 'Try again',
    secondaryAction,
    icon: Icon = TriangleAlert,
    className,
    headingLevel = 2,
}) {
    const Heading = `h${headingLevel}`;
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-ds-lg border border-ds-destructive/30 bg-ds-destructive/5 px-6 py-12 text-center", className)}>
            <span className="mb-3 flex size-11 items-center justify-center rounded-ds-lg bg-ds-destructive/10 text-ds-destructive">
                {Icon ? <Icon aria-hidden="true" className="size-5" /> : null}
            </span>
            <Heading className="text-sm font-semibold text-ds-foreground">{title}</Heading>
            <p className="mt-1 max-w-sm text-sm text-ds-muted-foreground">{description}</p>
            {(onRetry || secondaryAction) && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {onRetry ? (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                            <RefreshCw aria-hidden="true" />
                            {retryLabel}
                        </Button>
                    ) : null}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
}

export { ErrorState };
