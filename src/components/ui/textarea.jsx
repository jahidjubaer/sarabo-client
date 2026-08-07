import { cn } from '../../lib/utils';

function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                "flex min-h-20 w-full rounded-ds border border-ds-input bg-ds-background px-3 py-2 text-sm text-ds-foreground shadow-sm transition-colors",
                "placeholder:text-ds-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring focus-visible:ring-offset-1 focus-visible:ring-offset-ds-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "aria-[invalid=true]:border-ds-destructive aria-[invalid=true]:focus-visible:ring-ds-destructive",
                className
            )}
            {...props}
        />
    );
}

export { Textarea };
