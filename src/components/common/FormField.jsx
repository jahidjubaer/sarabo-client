import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

// Consistent field presentation for react-hook-form (and any) forms: an
// associated Label (htmlFor/id), the control (passed as children), and either
// a hint or an error message beneath it. Deliberately thin - it does NOT wrap
// react-hook-form's register/control internals; the caller still owns the
// control and passes `error` (e.g. errors.field?.message) and, on the control,
// aria-invalid so the error styling and message stay in sync.
function FormField({ id, label, required, error, hint, children, className }) {
    return (
        <div className={cn("space-y-1.5", className)}>
            {label ? (
                <Label htmlFor={id}>
                    {label}
                    {required ? <span className="ml-0.5 text-ds-destructive" aria-hidden="true">*</span> : null}
                </Label>
            ) : null}
            {children}
            {hint && !error ? <p id={id ? `${id}-hint` : undefined} className="text-xs text-ds-muted-foreground">{hint}</p> : null}
            {error ? <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-ds-destructive">{error}</p> : null}
        </div>
    );
}

export { FormField };
