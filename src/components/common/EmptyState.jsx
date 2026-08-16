import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

// Reusable empty state: a lucide icon, a concise title, an optional
// description, and an optional action (e.g. a "Create request" button). Copy
// is meant to stay short and professional at the call site.
//
// `headingLevel` (Phase 13A) picks the heading ELEMENT only - the visual style
// is fixed, so changing it never changes how this looks. It defaults to 2
// because the common case is a state rendered directly under the route's h1,
// where the previous hard-coded h3 skipped a level. Pass 3 when the state sits
// inside a section that already owns an h2, or 1 in the rare branch where the
// state IS the whole route and no other heading is rendered.
function EmptyState({ icon: Icon = Inbox, title, description, action, className, headingLevel = 2 }) {
    const Heading = `h${headingLevel}`;
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-ds-lg border border-dashed border-ds-border bg-ds-card px-6 py-12 text-center", className)}>
            {Icon ? (
                <span className="mb-3 flex size-11 items-center justify-center rounded-ds-lg bg-ds-muted text-ds-muted-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
            ) : null}
            <Heading className="text-sm font-semibold text-ds-foreground">{title}</Heading>
            {description ? <p className="mt-1 max-w-sm text-sm text-ds-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

export { EmptyState };
