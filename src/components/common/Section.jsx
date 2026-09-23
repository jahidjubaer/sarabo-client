import { useId } from 'react';
import { cn } from '../../lib/utils';

// A titled region of a page. Replaces the per-view SectionCard copies.
//
//   <Section title="Needs you" description="…" actions={…} headingLevel={2}>
//
// `headingLevel` picks the element only (h2 under the page h1, h3 inside a
// section that already owns an h2) so heading order never skips a level; the
// visual size follows the level. `variant="card"` wraps the content in a
// bordered card; the default is a plain region on the canvas.
function Section({ title, description, actions, headingLevel = 2, variant = 'plain', className, contentClassName, children }) {
    const headingId = useId();
    const Heading = `h${headingLevel}`;
    const card = variant === 'card';

    return (
        <section
            aria-labelledby={title ? headingId : undefined}
            className={cn(card && 'rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6', className)}
        >
            {title || actions ? (
                <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 space-y-0.5">
                        {title ? (
                            <Heading id={headingId} className={headingLevel <= 2 ? 'text-heading text-ds-foreground' : 'text-subhead text-ds-foreground'}>
                                {title}
                            </Heading>
                        ) : null}
                        {description ? <p className="text-body-sm text-ds-muted-foreground">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            <div className={contentClassName}>{children}</div>
        </section>
    );
}

export { Section };
