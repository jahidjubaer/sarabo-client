// Static informational content only (Phase 7.10: ds-*) - no MFA/encryption/
// monitoring claims, and no emailVerified status: showing it here would raise
// an unanswerable "how do I verify?" question since no verification flow exists
// yet (that's listed as future direction on the About page, not implemented).
const AccountSecurityCard = () => (
    <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
        <h2 className="text-base font-semibold text-ds-foreground">Account &amp; security</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ds-muted-foreground">
            <li>Email is managed through the authenticated account.</li>
            <li>Role permissions determine which dashboard operations are available.</li>
            <li>Sensitive actions remain protected by authenticated and role-checked routes.</li>
        </ul>
    </div>
);

export default AccountSecurityCard;
