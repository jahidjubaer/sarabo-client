import { cn } from '../../lib/utils';
import { alertVariants } from './alert-variants';

// Inline alert banner (distinct from a toast: an alert stays in the layout).
// Tones (see ./alert-variants) use the semantic scale; an optional leading icon
// is laid out via the grid rules. role="alert" is applied so urgent content is
// announced by assistive tech.
function Alert({ className, tone, ...props }) {
    return <div role="alert" className={cn(alertVariants({ tone }), className)} {...props} />;
}

function AlertTitle({ className, ...props }) {
    return <div className={cn("col-start-2 font-medium leading-none", className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
    return <div className={cn("col-start-2 text-sm text-ds-muted-foreground", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
