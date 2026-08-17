import { Link } from 'react-router';
import { Bell, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../config/dashboardNavigation';

function getInitials(name) {
    if (!name) return '';
    return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

// Account control for the PUBLIC header. Replaces the old signed-in cluster
// (a Dashboard button plus a bare log-out icon) with one avatar that opens the
// account actions, so the bar keeps its public navigation instead of spending
// width on account chrome.
//
// AUTH IS UNCHANGED. It reads the existing useAuth user and calls the existing
// logOut - no new auth behaviour, no new user data, and route guards remain the
// only access boundary. Only already-known fields are shown: display name,
// email, and the role label when the role has actually resolved.
//
// Interaction comes from Radix DropdownMenu, which is click-driven (never
// hover-only) and already provides Enter/Space activation, Escape to close,
// outside-click to close, arrow-key navigation, aria-haspopup + aria-expanded
// on the trigger, and focus returned to the avatar on close.
function AccountMenu({ role, className = '' }) {
    const { user, logOut } = useAuth();
    if (!user) return null;

    const displayName = user.displayName || user.email || 'Account';
    const roleLabel = ROLE_LABELS[role];

    const handleLogOut = () => {
        logOut().catch((error) => {
            if (import.meta.env.DEV) console.error('Logout failed:', error.message);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Open account menu for ${displayName}`}
                    className={`focus-ring shrink-0 rounded-full ring-offset-2 ring-offset-ds-background transition-colors hover:ring-2 hover:ring-ds-border ${className}`}
                >
                    <Avatar className="size-9 border border-ds-border">
                        {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
                        <AvatarFallback className="text-body-sm font-semibold">
                            {getInitials(displayName) || <UserIcon className="size-4" aria-hidden="true" />}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-body-sm font-semibold text-ds-foreground" title={displayName}>{displayName}</p>
                    {user.email && <p className="truncate text-micro text-ds-muted-foreground" title={user.email}>{user.email}</p>}
                    {roleLabel && <p className="ds-label mt-1.5 text-ds-primary">{roleLabel}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard"><LayoutDashboard aria-hidden="true" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard/profile"><UserIcon aria-hidden="true" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard/notifications"><Bell aria-hidden="true" />Notifications</Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogOut}>
                    <LogOut aria-hidden="true" />Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default AccountMenu;
