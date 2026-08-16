import {
    UserPlus,
    UserCheck,
    UserX,
    Wrench,
    Truck,
    BadgeCheck,
    CreditCard,
    Bell,
} from 'lucide-react';

// Exact server event types (see sarabo-server's utils/notificationEvents.js)
// mapped to a purely visual icon - the raw type string itself is never
// shown to the user. Any type not listed here (including a future server
// event this client hasn't been updated for) falls back to a generic bell,
// never breaking the item's render.
//
// Phase 12: moved from react-icons/fa to Lucide so notification rows use the
// same icon family, weight and sizing convention as every other redesigned
// surface (see config/statusPresentation.js, which these deliberately echo -
// a completed repair reads as the same BadgeCheck in both places).
const ICON_BY_TYPE = {
    technician_application_submitted: UserPlus,
    technician_application_approved: UserCheck,
    technician_application_rejected: UserX,
    technician_assigned: Wrench,
    new_repair_assignment: Wrench,
    technician_on_the_way: Truck,
    repair_in_progress: Wrench,
    repair_completed: BadgeCheck,
    payment_confirmed: CreditCard,
};

// Returns a rendered element (not a component reference) - this is a plain
// helper function, never treated as a component/hook itself, so selecting
// among the imported icon components here at call time never conflicts with
// the "no components created during render" rule that applies to actual
// components/hooks (see NotificationItem.jsx, which calls this directly
// rather than assigning the result to a capitalized JSX-tag variable).
export function renderNotificationIcon(type, props) {
    const IconComponent = ICON_BY_TYPE[type] || Bell;
    return <IconComponent {...props} />;
}
