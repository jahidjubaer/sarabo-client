import { Badge } from '../ui/badge';
import { getStatusPresentation } from '../../config/statusPresentation';

// Design-system status badge (Phase 7.1). Given a raw backend status it renders
// the human label + semantic tone + icon from config/statusPresentation.js -
// a normal user never sees the raw status string, and meaning is carried by
// label + icon, not colour alone. This is the canonical status badge for
// redesigned surfaces; the legacy DaisyUI components/StatusBadge/StatusBadge.jsx
// stays in place for not-yet-migrated pages.
function StatusBadge({ status, showIcon = true, className }) {
    const { label, tone, icon: Icon } = getStatusPresentation(status);
    return (
        <Badge tone={tone} className={className}>
            {showIcon && Icon ? <Icon aria-hidden="true" /> : null}
            {label}
        </Badge>
    );
}

export { StatusBadge };
