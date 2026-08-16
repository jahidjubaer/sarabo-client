import { Card } from '../../../components/ui/card';

// Static informational content only (Phase 7.10: ds-*; Phase 12: type scale +
// shared Card) - no MFA/encryption/monitoring claims, no session history, no
// connected devices, no security score, and no password-change control,
// because none of those are implemented. Email verification status is not
// repeated here either: it already has an authoritative slot in the identity
// card above, and duplicating it would only make this quiet block louder.
// Every line below describes how the app actually behaves today.
const AccountSecurityCard = () => (
    <Card className="p-5 sm:p-6">
        <h2 className="ds-label text-ds-muted-foreground">Account &amp; security</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-body-sm text-ds-muted-foreground">
            <li>Email is managed through the authenticated account.</li>
            <li>Role permissions determine which dashboard operations are available.</li>
            <li>Sensitive actions remain protected by authenticated and role-checked routes.</li>
        </ul>
    </Card>
);

export default AccountSecurityCard;
