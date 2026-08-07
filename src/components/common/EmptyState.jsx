import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

// Reusable empty state: a lucide icon, a concise title, an optional
// description, and an optional action (e.g. a "Create request" button). Copy
// is meant to stay short and professional at the call site.
function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-ds-lg border border-dashed border-ds-border bg-ds-card px-6 py-12 text-center", className)}>
            {Icon ? (
                <span className="mb-3 flex size-11 items-center justify-center rounded-ds-lg bg-ds-muted text-ds-muted-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
            ) : null}
            <h3 className="text-sm font-semibold text-ds-foreground">{title}</h3>
            {description ? <p className="mt-1 max-w-sm text-sm text-ds-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

export { EmptyState };
