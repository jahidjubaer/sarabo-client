import { TriangleAlert, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

// Error surface with an optional Retry. It only ever renders the safe,
// human-readable strings the caller passes - never a raw Axios/Mongo/backend
// message - so mapping a caught error to a friendly description is the
// caller's job (the existing *ErrorMessage helpers).
//
// `headingLevel` picks the heading ELEMENT only; see EmptyState.
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
        <div className={cn('flex flex-col items-center justify-center rounded-ds-lg border border-ds-border bg-ds-card px-6 py-12 text-center', className)}>
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-ds-danger-subtle text-ds-danger-subtle-foreground">
                {Icon ? <Icon aria-hidden="true" className="size-6" /> : null}
            </span>
            <Heading className="text-subhead text-ds-foreground">{title}</Heading>
            <p className="mt-1 max-w-sm text-body-sm text-ds-muted-foreground">{description}</p>
            {(onRetry || secondaryAction) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {onRetry ? (
                        <Button variant="outline" onClick={onRetry}>
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
