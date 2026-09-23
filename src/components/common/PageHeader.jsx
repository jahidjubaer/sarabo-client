import { cn } from '../../lib/utils';

// Page header: the route's single h1, an optional one-line description, and a
// right-aligned actions area that wraps under the title on narrow screens.
// No eyebrow - one heading plus one line replaces eyebrow + heading + paragraph.
// Role-agnostic: the same header serves customer, technician and admin pages.
// `id` defaults to "page-title" so route-change focus lands on it.
function PageHeader({ title, description, actions, breadcrumb, className, id = 'page-title' }) {
    return (
        <header className={cn('flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0 space-y-1">
                {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
                <h1 id={id} tabIndex={-1} className="text-title text-ds-foreground outline-none">{title}</h1>
                {description ? <p className="max-w-2xl text-body-sm text-ds-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}

export { PageHeader };
