import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

// Native <select>, themed. Native keeps the platform picker on phones, full
// keyboard support and screen-reader semantics for free; `color-scheme` in the
// tokens makes its popup follow dark mode. Replaces the copy-pasted
// `selectClass` strings. Props (including a react-hook-form `register()` ref,
// aria-* from FormField) go straight to the <select>.
//
//   size="default"  44px, form fields
//   size="sm"       36px, table toolbars and filters
function Select({ className, wrapperClassName, size = 'default', children, ...props }) {
    return (
        <div className={cn('relative', wrapperClassName)}>
            <select
                className={cn(
                    'w-full cursor-pointer appearance-none rounded-ds border border-ds-input bg-ds-background pl-3 pr-10 text-ds-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring focus-visible:ring-offset-1 focus-visible:ring-offset-ds-background',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'aria-[invalid=true]:border-ds-destructive',
                    size === 'sm' ? 'h-9 text-body-sm' : 'h-11 text-body',
                    className
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground"
            />
        </div>
    );
}

export { Select };
