import { useId, useState } from 'react';
import { ChevronDown, CircleCheck, CircleDot, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATE_ICON = {
    done: { Icon: CircleCheck, className: 'text-ds-success' },
    current: { Icon: CircleDot, className: 'text-ds-info' },
    info: { Icon: Circle, className: 'text-ds-muted-foreground' },
};

// One stage of a repair (request, inspection, quote, payment, repair, handover)
// as a collapsible card: a heading row with a state icon and a one-line
// summary (`meta`), and the stage's own section component as the body. Past
// stages start collapsed so the page leads with what matters now; every body
// stays one click away. The height animates with the same grid-rows technique
// as the accordion, neutralised under reduced motion.
function StageSection({ id, title, meta, state = 'info', defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    const baseId = useId();
    const buttonId = `${baseId}-button`;
    const panelId = `${baseId}-panel`;
    const { Icon, className: iconClass } = STATE_ICON[state] || STATE_ICON.info;

    return (
        <section id={id} aria-labelledby={buttonId} className="scroll-mt-24 overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card">
            <h2 className="m-0">
                <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((value) => !value)}
                    className="focus-ring flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ds-muted/50 sm:px-6"
                >
                    <Icon aria-hidden="true" className={cn('size-5 shrink-0', iconClass)} />
                    <span className="min-w-0 flex-1">
                        <span className="block text-subhead text-ds-foreground">{title}</span>
                        {meta ? <span className="mt-0.5 block truncate text-body-sm font-normal text-ds-muted-foreground">{meta}</span> : null}
                    </span>
                    <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 text-ds-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
                </button>
            </h2>
            <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
                <div className="min-h-0 overflow-hidden" inert={!open}>
                    <div className="border-t border-ds-border px-5 py-5 sm:px-6">{children}</div>
                </div>
            </div>
        </section>
    );
}

export { StageSection };
