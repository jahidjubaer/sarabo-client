import { cn } from '../../lib/utils';

// Text input primitive. In React 19 `ref` is an ordinary prop, so spreading
// `{...props}` forwards react-hook-form's `register()` ref/handlers straight
// onto the underlying <input> - no forwardRef wrapper needed. Invalid state is
// driven by aria-invalid so the error ring never relies on colour alone.
function Input({ className, type = "text", ...props }) {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 py-2 text-sm text-ds-foreground shadow-sm transition-colors",
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

export { Input };
