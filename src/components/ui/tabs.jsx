import { useRef } from 'react';
import { cn } from '../../lib/utils';

// Accessible tabs following the WAI-ARIA tabs pattern: one tab stop for the
// whole list (roving tabindex), Left/Right/Home/End move and select, each tab
// controls a panel. Controlled - the caller owns `value`.
//
//   <Tabs idBase="exceptions" label="Exception type" value={tab}
//         onValueChange={setTab} items={[{ value, label, count }]} />
//   <TabPanel idBase="exceptions" value="unassigned" active={tab === 'unassigned'}>…</TabPanel>
//
// `count` renders a small pill; pass null/undefined to hide it (never a false 0
// while loading).
function tabId(idBase, value) {
    return `${idBase}-tab-${value}`;
}

function panelId(idBase, value) {
    return `${idBase}-panel-${value}`;
}

function Tabs({ idBase, label, items, value, onValueChange, className }) {
    const listRef = useRef(null);

    const focusAndSelect = (index) => {
        const item = items[(index + items.length) % items.length];
        onValueChange(item.value);
        const button = listRef.current?.querySelector(`#${CSS.escape(tabId(idBase, item.value))}`);
        button?.focus();
    };

    const onKeyDown = (event) => {
        const current = items.findIndex((item) => item.value === value);
        if (event.key === 'ArrowRight') { event.preventDefault(); focusAndSelect(current + 1); }
        else if (event.key === 'ArrowLeft') { event.preventDefault(); focusAndSelect(current - 1); }
        else if (event.key === 'Home') { event.preventDefault(); focusAndSelect(0); }
        else if (event.key === 'End') { event.preventDefault(); focusAndSelect(items.length - 1); }
    };

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className={cn('flex gap-1 overflow-x-auto border-b border-ds-border', className)}
        >
            {items.map((item) => {
                const selected = item.value === value;
                return (
                    <button
                        key={item.value}
                        id={tabId(idBase, item.value)}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={panelId(idBase, item.value)}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onValueChange(item.value)}
                        className={cn(
                            '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-body-sm font-semibold transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ds-ring',
                            selected
                                ? 'border-ds-action text-ds-foreground'
                                : 'border-transparent text-ds-muted-foreground hover:text-ds-foreground'
                        )}
                    >
                        {item.label}
                        {typeof item.count === 'number' ? (
                            <span
                                className={cn(
                                    'ds-numeric flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-micro font-bold',
                                    selected ? 'bg-ds-attention-subtle text-ds-attention-subtle-foreground' : 'bg-ds-muted text-ds-muted-foreground'
                                )}
                            >
                                {item.count}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}

function TabPanel({ idBase, value, active, className, children }) {
    return (
        <div
            id={panelId(idBase, value)}
            role="tabpanel"
            aria-labelledby={tabId(idBase, value)}
            hidden={!active}
            tabIndex={0}
            className={cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring', className)}
        >
            {active ? children : null}
        </div>
    );
}

export { Tabs, TabPanel };
