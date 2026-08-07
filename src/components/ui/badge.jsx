import { cn } from '../../lib/utils';
import { badgeVariants } from './badge-variants';

// Tonal badge: semantic meaning is carried by BOTH a tint and its label text,
// never colour alone (accessibility). Tones (see ./badge-variants) map to the
// `ds-` semantic scale and adapt to dark mode. Consumed by the design-system
// StatusBadge (components/common/StatusBadge.jsx), which resolves a raw status
// into { label, tone } via config/statusPresentation.js.
function Badge({ className, tone, ...props }) {
    return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge };
