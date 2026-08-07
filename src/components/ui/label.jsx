import { cn } from '../../lib/utils';

// Native <label>; callers pass htmlFor to associate it with a control. The
// peer-disabled rules dim the label when its control is disabled.
function Label({ className, ...props }) {
    return (
        <label
            className={cn(
                "text-sm font-medium text-ds-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className
            )}
            {...props}
        />
    );
}

export { Label };
