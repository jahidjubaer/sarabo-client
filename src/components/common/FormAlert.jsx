import { CircleCheckBig, Info, TriangleAlert, CircleX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const ICONS = { success: CircleCheckBig, info: Info, warning: TriangleAlert, danger: CircleX };

// Inline form-level message (replaces SweetAlert popups on the auth pages).
// Pass `alert` as { tone, title, text } or null. It stays in the layout next to
// the form it belongs to and is announced once (role="alert" on Alert).
function FormAlert({ alert, className }) {
    if (!alert) return null;
    const Icon = ICONS[alert.tone] || Info;
    return (
        <Alert tone={alert.tone} className={className}>
            <Icon aria-hidden="true" />
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.text ? <AlertDescription>{alert.text}</AlertDescription> : null}
        </Alert>
    );
}

export { FormAlert };
