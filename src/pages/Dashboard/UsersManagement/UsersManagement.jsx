import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldX, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { notify } from '../../../lib/notify';
import { getRoleLabel, getRoleTone, ROLE_FILTER_OPTIONS } from '../../../utils/adminPresentation';
import { getUserRoleUpdateErrorMessage } from '../../../utils/userRoleUpdateErrorMessage';

const selectClass = "h-10 rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring";
const EMPTY_USERS = [];

function initials(name) {
    if (!name) return '';
    return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

// Phase 7.5: user management on the design-system data table. The role-update
// API, its server-side safety (e.g. last-admin protection), the error mapper,
// and query invalidation are all PRESERVED - only the presentation, an added
// confirmation, and Toastify feedback changed.
const UsersManagement = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [pendingUserId, setPendingUserId] = useState(null);

    useEffect(() => {
        const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const usersQueryKey = ['users', search];
    const { refetch, data, isPending, isPaused, isError } = useQuery({
        queryKey: usersQueryKey,
        queryFn: async () => (await axiosSecure.get(`/users?searchText=${encodeURIComponent(search)}`)).data,
    });
    const hasUsableUsers = Array.isArray(data);
    const users = hasUsableUsers ? data : EMPTY_USERS;
    const isInitialLoading = isPending && !isPaused && !hasUsableUsers;
    const isUnavailableBeforeData = !hasUsableUsers && (isPaused || isError);
    const retryUsers = () => queryClient.resetQueries({ queryKey: usersQueryKey });

    const filteredUsers = useMemo(
        () => (roleFilter === 'all' ? users : users.filter((user) => user.role === roleFilter)),
        [users, roleFilter]
    );

    const applyRoleUpdate = (user, role, successMessage) => {
        setPendingUserId(user._id);
        axiosSecure.patch(`/users/${user._id}/role`, { role })
            .then((res) => {
                refetch();
                if (res.data.modifiedCount) notify.success(successMessage);
                else notify.info("No change was made - the list has been refreshed.");
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('User role update failed:', error);
                notify.error(getUserRoleUpdateErrorMessage(error));
                refetch();
            })
            .finally(() => setPendingUserId(null));
    };

    const confirmRoleChange = (user, role) => {
        if (pendingUserId) return;
        const makingAdmin = role === 'admin';
        Swal.fire({
            title: makingAdmin ? `Make ${user.displayName || 'this user'} an admin?` : `Remove admin access from ${user.displayName || 'this user'}?`,
            text: makingAdmin ? 'Admins have full management access to Sarabo.' : 'This user will return to a customer account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: makingAdmin ? '#2478A6' : '#d33',
            cancelButtonColor: '#64748b',
            confirmButtonText: makingAdmin ? 'Yes, make admin' : 'Yes, remove admin',
        }).then((result) => {
            if (!result.isConfirmed) return;
            applyRoleUpdate(user, role, makingAdmin ? `${user.displayName} is now an admin` : `${user.displayName} is no longer an admin`);
        });
    };

    const columns = useMemo(() => [
        {
            id: 'user', header: 'User', enableSorting: true, enableHiding: false,
            accessorFn: (row) => row.displayName || '',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                        {row.original.photoURL ? <AvatarImage src={row.original.photoURL} alt="" /> : null}
                        <AvatarFallback>{initials(row.original.displayName) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-ds-foreground">{row.original.displayName || 'Unnamed user'}</span>
                </div>
            ),
            meta: { label: 'User' },
        },
        {
            id: 'email', header: 'Email', enableSorting: false,
            cell: ({ row }) => <span className="break-all text-ds-muted-foreground">{row.original.email}</span>,
            meta: { label: 'Email' },
        },
        {
            id: 'role', header: 'Role', enableSorting: true,
            accessorFn: (row) => row.role,
            cell: ({ row }) => <Badge tone={getRoleTone(row.original.role)}>{getRoleLabel(row.original.role)}</Badge>,
            meta: { label: 'Role' },
        },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => {
                const user = row.original;
                const busy = pendingUserId === user._id;
                return (
                    <div className="flex justify-end">
                        {user.role === 'admin' ? (
                            <Button variant="outline" size="sm" className="text-ds-destructive hover:text-ds-destructive" disabled={busy} onClick={() => confirmRoleChange(user, 'user')}>
                                <ShieldX aria-hidden="true" />{busy ? 'Updating…' : 'Remove admin'}
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => confirmRoleChange(user, 'admin')}>
                                <ShieldCheck aria-hidden="true" />{busy ? 'Updating…' : 'Make admin'}
                            </Button>
                        )}
                    </div>
                );
            },
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [pendingUserId]);

    if (isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Admin" title="Users" />
                <ErrorState title="Couldn't load users" description="We couldn't load the user list right now. Please try again." onRetry={retryUsers} />
            </div>
        );
    }

    const renderCard = (user) => {
        const busy = pendingUserId === user._id;
        return (
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
                        <AvatarFallback>{initials(user.displayName) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ds-foreground">{user.displayName || 'Unnamed user'}</p>
                        <p className="truncate text-xs text-ds-muted-foreground">{user.email}</p>
                    </div>
                    <Badge tone={getRoleTone(user.role)}>{getRoleLabel(user.role)}</Badge>
                </div>
                <div className="mt-3 flex justify-end">
                    {user.role === 'admin' ? (
                        <Button variant="outline" size="sm" className="text-ds-destructive hover:text-ds-destructive" disabled={busy} onClick={() => confirmRoleChange(user, 'user')}>
                            <ShieldX aria-hidden="true" />{busy ? 'Updating…' : 'Remove admin'}
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => confirmRoleChange(user, 'admin')}>
                            <ShieldCheck aria-hidden="true" />{busy ? 'Updating…' : 'Make admin'}
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="users-search" className="sr-only">Search users</Label>
                <Input id="users-search" type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search users" className="pl-9" />
            </div>
            <Label htmlFor="users-role" className="sr-only">Filter by role</Label>
            <select id="users-role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
                {ROLE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Admin" title="Users" description={isInitialLoading ? 'Loading users...' : `${users.length} user${users.length === 1 ? '' : 's'}`} />
            <AdminDataTable
                columns={columns}
                data={filteredUsers}
                isLoading={isInitialLoading}
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                enableColumnVisibility
                emptyState={
                    <EmptyState
                        title={search || roleFilter !== 'all' ? 'No matching users' : 'No users found'}
                        description={search || roleFilter !== 'all' ? 'No users match your search or role filter.' : 'Users will appear here as people sign up.'}
                    />
                }
            />
        </div>
    );
};

export default UsersManagement;
