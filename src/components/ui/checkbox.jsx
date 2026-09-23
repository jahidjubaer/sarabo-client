import { cn } from '../../lib/utils';

// Native checkbox / radio tinted with the primary colour. The control is 20px;
// wrap it with its text in a <label> (CheckboxField does) so the whole row is a
// 44px-tall hit area.
function Checkbox({ className, type = 'checkbox', ...props }) {
    return (
        <input
            type={type}
            className={cn(
                'size-5 shrink-0 cursor-pointer accent-ds-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
}

// Checkbox (or radio) with its label and optional description, as one
// clickable row.
function CheckboxField({ label, description, className, ...props }) {
    return (
        <label className={cn('flex min-h-11 cursor-pointer items-start gap-3 py-2.5 has-[:disabled]:cursor-not-allowed', className)}>
            <Checkbox className="mt-0.5" {...props} />
            <span className="min-w-0">
                <span className="block text-body-sm font-semibold text-ds-foreground">{label}</span>
                {description ? <span className="mt-0.5 block text-body-sm text-ds-muted-foreground">{description}</span> : null}
            </span>
        </label>
    );
}

export { Checkbox, CheckboxField };
