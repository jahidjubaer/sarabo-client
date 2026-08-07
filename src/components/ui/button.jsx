import { cn } from '../../lib/utils';
import { buttonVariants } from './button-variants';

// Design-system button (Phase 7.1). shadcn-style variants driven entirely by
// the semantic `ds-` token scale (see ./button-variants), so it themes with
// light/dark automatically and never hardcodes a colour. Focus is always
// keyboard-visible (a ring is rendered on `:focus-visible`, never removed),
// disabled state is non-interactive but still legible, and `[&_svg]` rules give
// icon+text buttons consistent spacing without per-call-site tweaking.
//
// Defaults to type="button" so a design-system button dropped inside a form
// never submits it by accident - explicit type="submit" is required to submit.
function Button({ className, variant, size, type = "button", ...props }) {
    return (
        <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
}

export { Button };
