// Static informational content only - no MFA/encryption/monitoring claims,
// and no emailVerified status: showing it here would raise an unanswerable
// "how do I verify?" question since no verification flow exists yet (that's
// listed as future direction on the About page, not implemented).
const AccountSecurityCard = () => (
    <div className="card border border-base-300 bg-base-100 p-6">
        <h2 className="text-lg font-semibold">Account &amp; Security</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm opacity-70">
            <li>Email is managed through the authenticated account.</li>
            <li>Role permissions determine which dashboard operations are available.</li>
            <li>Sensitive actions remain protected by authenticated and role-checked routes.</li>
        </ul>
    </div>
);

export default AccountSecurityCard;
