import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldX, Search, Info } from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
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
import { Select } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

const EMPTY_USERS = [];
const PAGE_LIMIT = 20;
// A server that predates paging ignores `page` and answers with a bare array
// of its 5 newest matches. The page still works against it, and says so.
const LEGACY_RESULT_CAP = 5;

// Normalises both GET /users answers: { data, pagination } from a paging
// server, or the legacy bare array (pagination: null).
function readUsersPage(body) {
    if (Array.isArray(body)) return { users: body, pagination: null };
    if (Array.isArray(body?.data) && body.pagination && typeof body.pagination === 'object') {
        return { users: body.data, pagination: body.pagination };
    }
    return null;
}

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
    const [filters, setFilters] = useUrlFilters({ q: '', role: 'all', page: '1' });
    const search = filters.q;
    const roleFilter = ROLE_FILTER_OPTIONS.some((o) => o.value === filters.role) ? filters.role : 'all';
    const { page } = filters;
    const [searchInput, setSearchInput] = useState(search);
    const [pendingUserId, setPendingUserId] = useState(null);
    const [roleChange, setRoleChange] = useState(null);

    useEffect(() => {
        const handle = setTimeout(() => {
            const next = searchInput.trim();
            if (next !== search) setFilters({ q: next, page: 1 });
        }, 350);
        return () => clearTimeout(handle);
    }, [searchInput, search, setFilters]);

    // Server-side paging, search and role filter (GET /users?page=...).
    const usersQueryKey = ['users', { search, role: roleFilter, page }];
    const { refetch, data, isPending, isPaused, isError, isFetching } = useQuery({
        queryKey: usersQueryKey,
        queryFn: async () => {
            const params = { searchText: search, page, limit: PAGE_LIMIT };
            if (roleFilter !== 'all') params.role = roleFilter;
            return (await axiosSecure.get('/users', { params })).data;
        },
        placeholderData: keepPreviousData,
    });
    const usersPage = readUsersPage(data);
    const hasUsableUsers = !!usersPage;
    const users = hasUsableUsers ? usersPage.users : EMPTY_USERS;
    const pagination = usersPage?.pagination || null;
    const isLegacyServer = hasUsableUsers && !pagination;
    const isInitialLoading = isPending && !isPaused && !hasUsableUsers;
    const isUnavailableBeforeData = !hasUsableUsers && (isPaused || isError);
    const retryUsers = () => queryClient.resetQueries({ queryKey: usersQueryKey });

    // A paging server already filtered by role; a legacy one did not.
    const filteredUsers = useMemo(
        () => (!isLegacyServer || roleFilter === 'all' ? users : users.filter((user) => user.role === roleFilter)),
        [users, roleFilter, isLegacyServer]
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
            .finally(() => {
                setPendingUserId(null);
                setRoleChange(null);
            });
    };

    const confirmRoleChange = (user, role) => {
        if (pendingUserId) return;
        setRoleChange({ user, role });
    };

    const roleChangeName = roleChange?.user.displayName || 'this user';
    const makingAdmin = roleChange?.role === 'admin';
    const roleChangeDialog = (
        <ConfirmDialog
            open={Boolean(roleChange)}
            onOpenChange={(open) => { if (!open) setRoleChange(null); }}
            title={makingAdmin ? `Make ${roleChangeName} an admin?` : `Remove admin access from ${roleChangeName}?`}
            description={makingAdmin ? 'Admins have full management access to Sarabo.' : 'This user will return to a customer account.'}
            confirmLabel={makingAdmin ? 'Make admin' : 'Remove admin'}
            destructive={!makingAdmin}
            busy={Boolean(pendingUserId)}
            onConfirm={() => applyRoleUpdate(
                roleChange.user,
                roleChange.role,
                makingAdmin ? `${roleChange.user.displayName} is now an admin` : `${roleChange.user.displayName} is no longer an admin`
            )}
        />
    );

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
                <PageHeader title="Users" />
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
            <Select id="users-role" value={roleFilter} onChange={(e) => setFilters({ role: e.target.value, page: 1 })} size="sm" wrapperClassName="sm:w-52">
                {ROLE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users"
                description={pagination
                    ? `${pagination.totalItems}${search || roleFilter !== 'all' ? ' matching' : ''} account${pagination.totalItems === 1 ? '' : 's'}. Grant or remove Admin access.`
                    : 'Find an account by name or email to grant or remove Admin access.'}
            />
            {isLegacyServer && users.length >= LEGACY_RESULT_CAP && (
                <p className="flex items-start gap-2 rounded-ds-lg bg-ds-muted p-3 text-body-sm text-ds-muted-foreground">
                    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {search
                        ? `Showing the ${LEGACY_RESULT_CAP} newest accounts that match. Make the search more specific to find someone else.`
                        : `Showing the ${LEGACY_RESULT_CAP} newest accounts. Search by name or email to find anyone else.`}
                </p>
            )}
            <p className={cn('text-sm text-ds-muted-foreground transition-opacity', isFetching && hasUsableUsers ? 'opacity-100' : 'opacity-0')} role="status" aria-live="polite">Updating results…</p>
            <AdminDataTable
                caption="User accounts"
                columns={columns}
                data={filteredUsers}
                isLoading={isInitialLoading}
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                enableColumnVisibility
                {...(pagination ? {
                    manualPagination: true,
                    pageSize: pagination.limit,
                    totalRows: pagination.totalItems,
                    pageCount: pagination.totalPages,
                    pageIndex: pagination.page - 1,
                    onPageChange: (index) => setFilters({ page: index + 1 }),
                } : {})}
                emptyState={
                    <EmptyState
                        title={search || roleFilter !== 'all' ? 'No matching users' : 'No users found'}
                        description={search || roleFilter !== 'all' ? 'No users match your search or role filter.' : 'Users will appear here as people sign up.'}
                    />
                }
            />
            {roleChangeDialog}
        </div>
    );
};

export default UsersManagement;
