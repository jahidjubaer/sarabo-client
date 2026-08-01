import {
    FaUserPlus,
    FaUserCheck,
    FaUserTimes,
    FaTools,
    FaTruck,
    FaCheckCircle,
    FaCreditCard,
    FaBell,
} from 'react-icons/fa';

// Exact server event types (see sarabo-server's utils/notificationEvents.js)
// mapped to a purely visual icon - the raw type string itself is never
// shown to the user. Any type not listed here (including a future server
// event this client hasn't been updated for) falls back to a generic bell,
// never breaking the item's render.
const ICON_BY_TYPE = {
    technician_application_submitted: FaUserPlus,
    technician_application_approved: FaUserCheck,
    technician_application_rejected: FaUserTimes,
    technician_assigned: FaTools,
    new_repair_assignment: FaTools,
    technician_on_the_way: FaTruck,
    repair_in_progress: FaTools,
    repair_completed: FaCheckCircle,
    payment_confirmed: FaCreditCard,
};

// Returns a rendered element (not a component reference) - this is a plain
// helper function, never treated as a component/hook itself, so selecting
// among the imported icon components here at call time never conflicts with
// the "no components created during render" rule that applies to actual
// components/hooks (see NotificationItem.jsx, which calls this directly
// rather than assigning the result to a capitalized JSX-tag variable).
export function renderNotificationIcon(type, props) {
    const IconComponent = ICON_BY_TYPE[type] || FaBell;
    return <IconComponent {...props} />;
}
