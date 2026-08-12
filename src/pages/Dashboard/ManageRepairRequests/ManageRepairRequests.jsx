import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, UserCog, Search, X } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { buttonVariants } from '../../../components/ui/button-variants';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { getProductSummary } from '../../../utils/customerRequestPresentation';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { getManageRepairRequestsErrorMessage } from '../../../utils/manageRepairRequestsErrorMessage';
import { cn } from '../../../lib/utils';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending-pickup', label: 'Request Submitted' },
    { value: 'driver_assigned', label: 'Technician Assigned' },
    { value: 'rider_arriving', label: 'Technician On The Way' },
    { value: 'parcel_picked_up', label: 'Repair In Progress' },
    { value: 'parcel_delivered', label: 'Repair Completed' },
    { value: 'cancelled', label: 'Request Cancelled' },
];
const PAYMENT_OPTIONS = [
    { value: 'all', label: 'All payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
];
const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 10;
const selectClass = "h-10 rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring";

function PaymentBadge({ paid }) {
    return <Badge tone={paid ? 'success' : 'warning'}>{paid ? 'Paid' : 'Unpaid'}</Badge>;
}

// Phase 7.5: admin repair-request management on the design-system data table.
// SERVER-side pagination/search/filtering via /admin/parcels is PRESERVED
// exactly (same params, same { data, pagination } contract) - the table runs in
// manual mode over the current page rather than pulling all rows. Actions
// (view / assign) reuse the existing routes; no business logic changes.
const ManageRepairRequests = () => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
        queryKey: ['adminRepairRequests', { page, search: debouncedSearch, status, paymentStatus }],
        queryFn: async () => {
            const params = { page, limit: PAGE_LIMIT };
            if (debouncedSearch) params.search = debouncedSearch;
            if (status !== 'all') params.status = status;
            if (paymentStatus !== 'all') params.paymentStatus = paymentStatus;
            const res = await axiosSecure.get('/admin/parcels', { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
        retry: 1,
    });

    const hasActiveFilters = !!debouncedSearch || status !== 'all' || paymentStatus !== 'all';

    const handleResetFilters = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setStatus('all');
        setPaymentStatus('all');
        setPage(1);
    };

    const columns = useMemo(() => [
        {
            id: 'tracking', accessorKey: 'trackingId', header: 'Tracking', enableSorting: false, enableHiding: false,
            cell: ({ row }) => <span className="font-medium text-ds-foreground">{row.original.trackingId}</span>,
            meta: { label: 'Tracking' },
        },
        {
            id: 'customer', header: 'Customer', enableSorting: false,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="truncate text-ds-foreground">{row.original.senderName}</div>
                    <div className="truncate text-xs text-ds-muted-foreground">{row.original.senderEmail}</div>
                </div>
            ),
            meta: { label: 'Customer' },
        },
        {
            id: 'device', header: 'Device', enableSorting: false, enableHiding: false,
            cell: ({ row }) => row.original.parcelName,
            meta: { label: 'Device' },
        },
        {
            id: 'status', header: 'Status', enableSorting: false, enableHiding: false,
            cell: ({ row }) => <StatusBadge status={row.original.deliveryStatus || 'pending-pickup'} />,
            meta: { label: 'Status' },
        },
        {
            id: 'payment', header: 'Payment', enableSorting: false,
            cell: ({ row }) => <PaymentBadge paid={row.original.paymentStatus === 'paid'} />,
            meta: { label: 'Payment' },
        },
        {
            id: 'technician', header: 'Technician', enableSorting: false,
            cell: ({ row }) => row.original.technicianName || <span className="text-ds-muted-foreground">Unassigned</span>,
            meta: { label: 'Technician' },
        },
        {
            id: 'created', header: 'Created', enableSorting: false,
            cell: ({ row }) => <span className="whitespace-nowrap text-ds-muted-foreground">{row.original.createdAt ? formatAbsoluteDateTime(row.original.createdAt) : ''}</span>,
            meta: { label: 'Created' },
        },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Link to={`/dashboard/manage-repair-requests/${row.original._id}`} aria-label={`View request ${row.original.trackingId}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                        <Eye aria-hidden="true" className="size-4" />
                    </Link>
                    {row.original.canAssign && (
                        <Button variant="ghost" size="icon" aria-label={`Assign technician for ${row.original.trackingId}`} onClick={() => navigate(`/dashboard/assign-technicians?request=${row.original._id}`)}>
                            <UserCog aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </div>
            ),
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], [navigate]);

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Admin" title="Repair Requests" />
                <ErrorState title="Couldn't load repair requests" description={getManageRepairRequestsErrorMessage(error)} onRetry={() => refetch()} />
            </div>
        );
    }

    const requests = data?.data ?? [];
    const pagination = data?.pagination ?? { page: 1, limit: PAGE_LIMIT, totalItems: 0, totalPages: 1 };

    const renderCard = (request) => {
        const { device } = getProductSummary(request);
        return (
            <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ds-foreground">{device}</p>
                        <p className="truncate text-xs text-ds-muted-foreground">{request.trackingId}</p>
                    </div>
                    <StatusBadge status={request.deliveryStatus || 'pending-pickup'} className="shrink-0" />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><dt className="text-ds-muted-foreground">Customer</dt><dd className="truncate text-ds-foreground">{request.senderName}</dd></div>
                    <div><dt className="text-ds-muted-foreground">Technician</dt><dd className="truncate text-ds-foreground">{request.technicianName || 'Unassigned'}</dd></div>
                    <div><dt className="text-ds-muted-foreground">Payment</dt><dd><PaymentBadge paid={request.paymentStatus === 'paid'} /></dd></div>
                    <div><dt className="text-ds-muted-foreground">Created</dt><dd className="text-ds-foreground">{request.createdAt ? formatAbsoluteDateTime(request.createdAt) : ''}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                    <Link to={`/dashboard/manage-repair-requests/${request._id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><Eye aria-hidden="true" />View</Link>
                    {request.canAssign && <Button size="sm" onClick={() => navigate(`/dashboard/assign-technicians?request=${request._id}`)}><UserCog aria-hidden="true" />Assign</Button>}
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="manage-search" className="sr-only">Search requests</Label>
                <Input id="manage-search" type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search tracking, customer, device" className="pl-9" />
            </div>
            <Label htmlFor="manage-status" className="sr-only">Filter by status</Label>
            <select id="manage-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Label htmlFor="manage-payment" className="sr-only">Filter by payment</Label>
            <select id="manage-payment" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className={selectClass}>
                {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}><X aria-hidden="true" />Reset</Button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Admin" title="Repair Requests" description={`${pagination.totalItems} request${pagination.totalItems === 1 ? '' : 's'} across every stage`} />
            <p className={cn("text-sm text-ds-muted-foreground transition-opacity", isFetching ? "opacity-100" : "opacity-0")} role="status" aria-live="polite">Updating results…</p>
            <AdminDataTable
                columns={columns}
                data={requests}
                isLoading={isLoading}
                enableColumnVisibility
                getRowId={(row) => row._id}
                toolbar={toolbar}
                renderCard={renderCard}
                manualPagination
                pageCount={pagination.totalPages}
                pageIndex={pagination.page - 1}
                onPageChange={(index) => setPage(index + 1)}
                emptyState={
                    <EmptyState
                        title={hasActiveFilters ? 'No matching requests' : 'No repair requests yet'}
                        description={hasActiveFilters ? 'No requests match your search or filters.' : 'Repair requests will appear here as customers submit them.'}
                        action={hasActiveFilters ? <Button variant="outline" size="sm" onClick={handleResetFilters}>Reset filters</Button> : undefined}
                    />
                }
            />
        </div>
    );
};

export default ManageRepairRequests;
