import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// Accessible accordion (WAI-ARIA disclosure pattern): each question is a real
// <button> with aria-expanded/aria-controls inside a heading, each answer a
// labelled region. Opening animates the row height with a CSS grid-rows
// transition (0fr -> 1fr), which the global reduced-motion rule neutralises.
//
//   <Accordion items={[{ question, answer }]} defaultOpen={0} headingLevel={3} />
//
// `answer` may be a string (rendered as a paragraph) or any node; `key`
// defaults to the question text.
// Several items may be open at once; `defaultOpen` is the index opened first.
function Accordion({ items, defaultOpen = null, headingLevel = 3, className }) {
    const baseId = useId();
    const [open, setOpen] = useState(() => new Set(defaultOpen === null ? [] : [defaultOpen]));
    const Heading = `h${headingLevel}`;

    const toggle = (index) => {
        setOpen((current) => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    return (
        <div className={cn('divide-y divide-ds-border overflow-hidden rounded-ds-xl border border-ds-border bg-ds-card', className)}>
            {items.map((item, index) => {
                const expanded = open.has(index);
                const buttonId = `${baseId}-q-${index}`;
                const panelId = `${baseId}-a-${index}`;
                return (
                    <div key={item.key ?? item.question} className={cn('transition-colors', expanded && 'bg-ds-canvas')}>
                        <Heading className="m-0">
                            <button
                                id={buttonId}
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                onClick={() => toggle(index)}
                                className="focus-ring flex min-h-16 w-full items-center justify-between gap-6 px-5 py-4 text-left text-subhead text-ds-foreground sm:px-7"
                            >
                                {item.question}
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex size-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-300',
                                        expanded ? 'rotate-45 bg-ds-primary text-ds-primary-foreground' : 'bg-ds-muted text-ds-foreground'
                                    )}
                                >
                                    <Plus className="size-4" />
                                </span>
                            </button>
                        </Heading>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className={cn(
                                'grid transition-[grid-template-rows] duration-300 ease-out',
                                expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            )}
                        >
                            {/* inert keeps the collapsed answer out of the tab order and the
                                accessibility tree while it animates shut. */}
                            <div className="min-h-0 overflow-hidden" inert={!expanded}>
                                {typeof item.answer === 'string'
                                    ? <p className="max-w-3xl px-5 pb-6 text-body text-ds-muted-foreground sm:px-7">{item.answer}</p>
                                    : <div className="px-5 pb-6 sm:px-7">{item.answer}</div>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export { Accordion };
