import { Link } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { buttonVariants } from '../../../components/ui/button-variants';
import { ROLE_SHORTCUTS } from '../../Shared/NavBar/roleShortcuts';

// Role-aware account context (Phase 7.10: ds-*/Lucide; Phase 12: type scale +
// shared Card/Button). Copy is a fuller page context than the navbar dropdown;
// the shortcut label/route is reused from the shared source. For an approved
// technician (role 'rider'), an approval note is shown - that is derivable from
// the role itself (a user only holds the rider role after admin approval), not
// a fabricated field. No invented expertise / service-area / employee-id fields
// (the app exposes no such data source here). The raw role string is never
// rendered: 'rider' always reads as Technician.
const ROLE_CONTEXT = {
    user: { title: 'Customer account', text: 'Submit repair requests, track progress, manage eligible cancellations, and review supported payment records.' },
    rider: { title: 'Technician account', text: 'Access assigned repairs and perform the workflow actions available to approved technicians.', approved: true },
    admin: { title: 'Administrator account', text: 'Manage users, technician applications, repair requests, assignments, and protected administrative operations.' },
};

const RoleContextCard = ({ role, roleLoading, isError, onRetry }) => {
    const roleKnown = typeof role === 'string';
    const context = roleKnown ? ROLE_CONTEXT[role] : null;
    const shortcut = roleKnown ? ROLE_SHORTCUTS[role] : null;

    return (
        <Card className="p-5 sm:p-6">
            <h2 className="ds-label text-ds-muted-foreground">Account context</h2>
            {context ? (
                <>
                    <h3 className="mt-3 text-subhead text-ds-foreground">{context.title}</h3>
                    <p className="mt-1.5 text-body-sm text-ds-muted-foreground">{context.text}</p>
                    {context.approved && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-ds-success">
                            <ShieldCheck aria-hidden="true" className="size-4" /> Approved technician
                        </p>
                    )}
                    {shortcut && (
                        <Link to={shortcut.to} className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4`}>
                            {shortcut.label}
                        </Link>
                    )}
                </>
            ) : (
                <>
                    <p className="mt-3 text-body-sm text-ds-muted-foreground">
                        {roleLoading ? 'Loading account context…' : 'Account context is unavailable right now.'}
                    </p>
                    {!roleLoading && (isError || !roleKnown) && onRetry && (
                        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
                            Try again
                        </Button>
                    )}
                </>
            )}
        </Card>
    );
};

export default RoleContextCard;
