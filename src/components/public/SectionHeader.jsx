import { cn } from '../../lib/utils';

// The shared rhythm for every public section: eyebrow -> strong heading ->
// one short line -> (the section's visual/action content follows). Using one
// component keeps size, spacing and alignment identical everywhere, so
// sections read as one product instead of unrelated blocks.
//
//   <SectionHeader eyebrow="Services" title="What needs repairing?"
//     description="…" align="center" id="home-services-heading" as="h2" />
//
// `as` picks the heading element (h1 on a page intro, h2 for sections);
// `action` renders a link or button beside a left-aligned header.
function SectionHeader({ eyebrow, title, description, align = 'left', as = 'h2', id, action, className, tone = 'default' }) {
    const Heading = as;
    const centered = align === 'center';
    const onInk = tone === 'ink';
    return (
        <div
            className={cn(
                'flex flex-col gap-4',
                centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
                className
            )}
        >
            <div className={cn('max-w-2xl', centered && 'mx-auto')}>
                {eyebrow ? <p className={cn('ds-eyebrow', onInk && 'text-ds-action')}>{eyebrow}</p> : null}
                <Heading
                    id={id}
                    tabIndex={as === 'h1' ? -1 : undefined}
                    className={cn(
                        'text-title outline-none sm:text-headline',
                        eyebrow && 'mt-3',
                        onInk ? 'text-ds-ink-foreground' : 'text-ds-foreground'
                    )}
                >
                    {title}
                </Heading>
                {description ? (
                    <p className={cn('mt-3 text-body', onInk ? 'text-ds-ink-muted' : 'text-ds-muted-foreground')}>{description}</p>
                ) : null}
            </div>
            {action && !centered ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

export default SectionHeader;
