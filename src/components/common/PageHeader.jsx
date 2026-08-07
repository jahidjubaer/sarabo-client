import { cn } from '../../lib/utils';

// Operational page header. Compact by design (title tops out at text-2xl - no
// oversized dashboard headings), with optional eyebrow, description, a
// breadcrumb slot, and a right-aligned actions area that wraps under the title
// on narrow screens. Role-agnostic: the same header serves customer,
// technician and admin pages.
function PageHeader({ eyebrow, title, description, actions, breadcrumb, className }) {
    return (
        <header className={cn("flex flex-col gap-4 border-b border-ds-border pb-5 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="min-w-0 space-y-1">
                {breadcrumb ? <div className="mb-1">{breadcrumb}</div> : null}
                {eyebrow ? <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">{eyebrow}</p> : null}
                <h1 className="truncate text-xl font-semibold tracking-tight text-ds-foreground sm:text-2xl">{title}</h1>
                {description ? <p className="max-w-2xl text-sm text-ds-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}

export { PageHeader };
