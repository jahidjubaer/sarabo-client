import { cn } from '../../lib/utils';

// A titled content block within a page. Lighter than a Card - use it to group
// related content under a section heading with an optional description and a
// single section-level action.
function PageSection({ title, description, action, children, className }) {
    const hasHeader = title || description || action;
    return (
        <section className={cn("space-y-4", className)}>
            {hasHeader && (
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        {title ? <h2 className="text-base font-semibold text-ds-foreground">{title}</h2> : null}
                        {description ? <p className="text-sm text-ds-muted-foreground">{description}</p> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            )}
            {children}
        </section>
    );
}

export { PageSection };
