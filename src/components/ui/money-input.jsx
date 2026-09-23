import { cn } from '../../lib/utils';

// Money entry. A text input with inputMode="decimal" rather than type="number":
// number inputs change on scroll-wheel, accept "e", and drop formatting.
// Parsing and validation stay with the caller. The currency symbol is visual;
// put the currency in the field's label (e.g. "Labour (BDT)") for screen readers.
function MoneyInput({ className, symbol = '৳', ...props }) {
    return (
        <div
            className={cn(
                'flex h-11 w-full overflow-hidden rounded-ds border border-ds-input bg-ds-background transition-colors',
                'focus-within:ring-2 focus-within:ring-ds-ring focus-within:ring-offset-1 focus-within:ring-offset-ds-background',
                'has-[input[aria-invalid=true]]:border-ds-destructive has-[input:disabled]:opacity-50',
                className
            )}
        >
            <span aria-hidden="true" className="flex items-center border-r border-ds-border bg-ds-muted px-3 font-semibold text-ds-muted-foreground">
                {symbol}
            </span>
            <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="ds-numeric min-w-0 flex-1 bg-transparent px-3 text-body text-ds-foreground outline-none placeholder:text-ds-muted-foreground disabled:cursor-not-allowed"
                {...props}
            />
        </div>
    );
}

export { MoneyInput };
