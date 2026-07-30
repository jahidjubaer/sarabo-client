import { Link } from 'react-router';
import { ROLE_SHORTCUTS } from '../../Shared/NavBar/roleShortcuts';

// Copy is deliberately different from Navbar's compact dropdown wording -
// this is a fuller page context, not a duplicate of that mapping. The
// shortcut label/route itself IS reused from the shared source, though.
const ROLE_CONTEXT = {
    user: { title: 'Customer Account', text: 'Submit repair requests, track progress, manage eligible cancellations, and review supported payment records.' },
    rider: { title: 'Technician Account', text: 'Access assigned repairs and perform the workflow actions available to approved technicians.' },
    admin: { title: 'Administrator Account', text: 'Manage users, technician applications, repair requests, assignments, and protected administrative operations.' },
};

// While role is loading or errored, show neutral text only - never assume
// Customer, never render a role-specific action link.
const RoleContextCard = ({ role, roleLoading, isError }) => {
    const roleKnown = !roleLoading && !isError;
    const context = roleKnown ? ROLE_CONTEXT[role] : null;
    const shortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;

    return (
        <div className="card border border-base-300 bg-base-100 p-6">
            <h2 className="text-lg font-semibold">Account Context</h2>
            {context ? (
                <>
                    <h3 className="mt-3 font-semibold">{context.title}</h3>
                    <p className="mt-1 text-sm opacity-70">{context.text}</p>
                    {shortcut && (
                        <Link to={shortcut.to} className="focus-ring btn btn-outline btn-sm mt-4">
                            {shortcut.label}
                        </Link>
                    )}
                </>
            ) : (
                <p className="mt-3 text-sm opacity-60">
                    {roleLoading ? 'Loading account context...' : 'Account context is unavailable right now.'}
                </p>
            )}
        </div>
    );
};

export default RoleContextCard;
