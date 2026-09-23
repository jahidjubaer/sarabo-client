import { Badge } from '../ui/badge';
import { getStatus } from '../../config/status';

// The one status badge. Given a stored status value it renders the label, tone
// and icon from the status registry (config/status), so no page keeps its own
// label or colour map and a raw status string is never shown.
//
//   <StatusBadge status={request.deliveryStatus} audience="customer" />
//   <StatusBadge domain="withdrawal" status={row.status} audience="admin" />
//
// `domain` defaults to "repair". `audience` (customer | technician | admin)
// lifts the status to amber `attention` only for the role that has to act.
// An unknown value renders nothing.
function StatusBadge({ status, domain = 'repair', audience, showIcon = true, size, className }) {
    const presentation = getStatus(domain, status, audience);
    if (!presentation) return null;
    const { label, tone, icon: Icon } = presentation;
    return (
        <Badge tone={tone} size={size} className={className}>
            {showIcon && Icon ? <Icon aria-hidden="true" /> : null}
            {label}
        </Badge>
    );
}

export { StatusBadge };
