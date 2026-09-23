import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

// Empty state: an icon, one line of title, an optional short description, and
// at most one action. A filtered-empty list should pass a "Clear filters"
// action rather than a create action.
//
// `headingLevel` picks the heading ELEMENT only - the visual style is fixed.
// Default 2 (a state directly under the route's h1); pass 3 inside a section
// that already owns an h2.
function EmptyState({ icon: Icon = Inbox, title, description, action, className, headingLevel = 2 }) {
    const Heading = `h${headingLevel}`;
    return (
        <div className={cn('flex flex-col items-center justify-center rounded-ds-lg border border-dashed border-ds-border bg-ds-card px-6 py-12 text-center', className)}>
            {Icon ? (
                <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-ds-accent text-ds-accent-foreground">
                    <Icon aria-hidden="true" className="size-6" />
                </span>
            ) : null}
            <Heading className="text-subhead text-ds-foreground">{title}</Heading>
            {description ? <p className="mt-1 max-w-sm text-body-sm text-ds-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export { EmptyState };
