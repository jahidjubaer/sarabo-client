import { Link } from 'react-router';
import { ChevronDown, LayoutDashboard, LogOut, User as UserIcon, Home } from 'lucide-react';
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

// Compact account menu. Shows only known-safe user data (display name, email,
// role label, avatar/initials). Logout reuses the existing AuthProvider logOut
// exactly (route guards + auth-state change handle the redirect); no auth logic
// is rewritten and no toast noise is added.
function UserMenu({ role }) {
    const { user, logOut } = useAuth();
    if (!user) return null;

    const displayName = user.displayName || user.email || 'Account';
    const roleLabel = ROLE_LABELS[role];

    const handleLogout = () => {
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
                    className="focus-ring flex items-center gap-2 rounded-full p-1 hover:bg-ds-muted"
                >
                    <Avatar className="size-8">
                        {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
                        <AvatarFallback>
                            {getInitials(displayName) || <UserIcon className="size-4" aria-hidden="true" />}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown aria-hidden="true" className="hidden size-4 text-ds-muted-foreground sm:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold" title={displayName}>{displayName}</p>
                    {user.email && <p className="truncate text-xs text-ds-muted-foreground" title={user.email}>{user.email}</p>}
                    {roleLabel && <p className="mt-1 text-xs font-medium text-ds-primary">{roleLabel}</p>}
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
                        <Link to="/"><Home aria-hidden="true" />Public home</Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                    <LogOut aria-hidden="true" />Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export { UserMenu };
