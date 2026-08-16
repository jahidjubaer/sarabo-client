import { cloneElement, isValidElement } from 'react';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

// Consistent field presentation for react-hook-form (and any) forms: an
// associated Label (htmlFor/id), the control (passed as children), and either
// a hint or an error message beneath it.
//
// Phase 13A: the hint/error text used to be RENDERED with an id but never
// CONNECTED to the control - every caller had to remember to repeat the id in
// its own `aria-describedby`, and a caller that forgot produced an error that
// was visible but not discoverable when the field was focused. FormField now
// wires that itself:
//
//   - the hint id and/or the error id are merged into the control's
//     `aria-describedby`, de-duplicated, and appended AFTER anything the
//     caller already set, so existing manual wiring keeps working and is never
//     announced twice;
//   - `aria-invalid` is set when `error` is present, unless the caller already
//     stated it explicitly (the caller wins - some controls report validity
//     differently).
//
// Deliberately NOT done here: no `role="alert"` and no aria-live on the error
// paragraph. Several forms already own that decision locally, and adding a
// second live region would double-announce every validation failure. Field
// order, validation rules and copy are untouched - this only creates the
// programmatic relationship that was already implied by the rendered ids.
function FormField({ id, label, required, error, hint, children, className }) {
    const hintId = hint && !error && id ? `${id}-hint` : undefined;
    const errorId = error && id ? `${id}-error` : undefined;
    const ownIds = [hintId, errorId].filter(Boolean);

    let control = children;
    if (isValidElement(children)) {
        const existing = String(children.props['aria-describedby'] ?? '')
            .split(/\s+/)
            .filter(Boolean);
        const describedBy = Array.from(new Set([...existing, ...ownIds])).join(' ');
        control = cloneElement(children, {
            'aria-describedby': describedBy || undefined,
            'aria-invalid': children.props['aria-invalid'] ?? (error ? true : undefined),
            // The visible asterisk is aria-hidden, and these forms run
            // noValidate with react-hook-form rules rather than the HTML
            // `required` attribute - so without this, a required field was
            // never announced as required. aria-required is advisory only and
            // triggers no browser validation, so no rule changes.
            'aria-required': children.props['aria-required'] ?? (required ? true : undefined),
        });
    }

    return (
        <div className={cn("space-y-1.5", className)}>
            {label ? (
                <Label htmlFor={id}>
                    {label}
                    {required ? <span className="ml-0.5 text-ds-destructive" aria-hidden="true">*</span> : null}
                </Label>
            ) : null}
            {control}
            {hint && !error ? <p id={hintId} className="text-xs text-ds-muted-foreground">{hint}</p> : null}
            {error ? <p id={errorId} className="text-xs font-medium text-ds-destructive">{error}</p> : null}
        </div>
    );
}

export { FormField };
