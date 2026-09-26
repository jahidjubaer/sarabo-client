import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { serviceDefinitionKeys } from '../../../hooks/serviceDefinitionKeys';
import { listAdminServiceDefinitions } from '../../../api/adminServiceDefinitions';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../../utils/currency';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { ServiceEditor } from '../../../components/admin/ServiceEditor';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';

const ADMIN_CATALOGUE_KEY = ['admin-service-definitions'];
const EMPTY = [];
const STATUS_OPTIONS = [
    { value: 'all', label: 'All services' },
    { value: 'active', label: 'Offered' },
    { value: 'inactive', label: 'Switched off' },
];

const priceRange = (d) => formatMoneyRange(d.pricingRule?.baseMin, d.pricingRule?.baseMax, d.pricingRule?.currency);
const inspectionFee = (d) => formatMoney(d.pricingRule?.inspectionFee, d.pricingRule?.currency);

function StatusBadge({ active }) {
    return active ? <Badge tone="success">Offered</Badge> : <Badge tone="neutral">Switched off</Badge>;
}

function RequestCounts({ definition }) {
    if (!definition.openRequests) return <span className="text-ds-muted-foreground">None</span>;
    return (
        <span className="flex flex-wrap items-center gap-1.5">
            <span className="ds-numeric">{definition.openRequests} open</span>
            {definition.waitingRequests > 0 && <Badge tone={definition.isActive ? 'waiting' : 'attention'}>{definition.waitingRequests} waiting</Badge>}
        </span>
    );
}

// Admin service catalogue (quick-wins phase): every service with its price,
// whether customers can choose it, and how many requests use it. Edits and
// additions happen in the ServiceEditor side panel; there is no delete -
// switching a service off is the only way to retire it, so request history
// always resolves.
const ServiceCatalogue = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useUrlFilters({ q: '', status: 'all' });
    const status = STATUS_OPTIONS.some((o) => o.value === filters.status) ? filters.status : 'all';
    // The sheet keeps its definition while it animates closed; null = "add".
    const [editor, setEditor] = useState({ open: false, definition: null });

    const { data, isPending, isError, isPaused } = useQuery({
        queryKey: ADMIN_CATALOGUE_KEY,
        queryFn: () => listAdminServiceDefinitions(axiosSecure),
    });
    const definitions = data?.serviceDefinitions ?? EMPTY;
    const availablePairs = data?.availablePairs ?? EMPTY;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_CATALOGUE_KEY });
        // The public catalogue (customer request form, Services page) caches separately.
        queryClient.invalidateQueries({ queryKey: serviceDefinitionKeys.all });
    };

    const visible = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        return definitions.filter((d) => {
            if (status === 'active' && !d.isActive) return false;
            if (status === 'inactive' && d.isActive) return false;
            if (!q) return true;
            return [d.label, humanizeSlug(d.productCategorySlug), humanizeSlug(d.repairCategorySlug)].some((text) => text.toLowerCase().includes(q));
        });
    }, [definitions, filters.q, status]);

    const columns = useMemo(() => [
        {
            id: 'device', header: 'Device', enableSorting: true, enableHiding: false,
            accessorFn: (row) => humanizeSlug(row.productCategorySlug),
            cell: ({ getValue }) => <span className="font-medium text-ds-foreground">{getValue()}</span>,
        },
        {
            id: 'service', header: 'Service', enableSorting: true, enableHiding: false,
            accessorFn: (row) => row.label,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <p className="font-medium text-ds-foreground">{row.original.label}</p>
                    <p className="text-micro text-ds-muted-foreground">{humanizeSlug(row.original.repairCategorySlug)}</p>
                </div>
            ),
        },
        {
            id: 'price', header: 'Price estimate', enableSorting: true,
            accessorFn: (row) => row.pricingRule?.baseMin ?? 0,
            cell: ({ row }) => <span className="ds-numeric">{priceRange(row.original)}</span>,
        },
        {
            id: 'inspection', header: 'Inspection fee', enableSorting: false,
            cell: ({ row }) => <span className="ds-numeric">{inspectionFee(row.original)}</span>,
        },
        {
            id: 'status', header: 'Status', enableSorting: true,
            accessorFn: (row) => (row.isActive ? 0 : 1),
            cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
        },
        {
            id: 'requests', header: 'Requests', enableSorting: true,
            accessorFn: (row) => row.openRequests,
            cell: ({ row }) => <RequestCounts definition={row.original} />,
        },
        {
            id: 'actions', header: '', enableSorting: false, enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditor({ open: true, definition: row.original })}>
                        <Pencil aria-hidden="true" />Edit<span className="sr-only"> {row.original.label}</span>
                    </Button>
                </div>
            ),
            meta: { label: 'Actions', headClassName: 'text-right', cellClassName: 'text-right' },
        },
    ], []);

    const renderCard = (d) => (
        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-micro font-semibold text-ds-muted-foreground">{humanizeSlug(d.productCategorySlug)}</p>
                    <p className="text-sm font-semibold text-ds-foreground">{d.label}</p>
                </div>
                <StatusBadge active={d.isActive} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-body-sm">
                <div><dt className="text-micro text-ds-muted-foreground">Price estimate</dt><dd className="ds-numeric">{priceRange(d)}</dd></div>
                <div><dt className="text-micro text-ds-muted-foreground">Inspection fee</dt><dd className="ds-numeric">{inspectionFee(d)}</dd></div>
                <div className="col-span-2"><dt className="text-micro text-ds-muted-foreground">Requests</dt><dd><RequestCounts definition={d} /></dd></div>
            </dl>
            <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditor({ open: true, definition: d })}>
                    <Pencil aria-hidden="true" />Edit<span className="sr-only"> {d.label}</span>
                </Button>
            </div>
        </div>
    );

    const addButton = (
        <Button variant="primary" onClick={() => setEditor({ open: true, definition: null })} disabled={!data || availablePairs.length === 0}>
            <Plus aria-hidden="true" />Add service
        </Button>
    );

    if (!data && (isError || isPaused)) {
        return (
            <div className="space-y-6">
                <PageHeader title="Services & prices" />
                <ErrorState title="Couldn't load the catalogue" description="We couldn't load the services right now. Please try again." onRetry={() => queryClient.resetQueries({ queryKey: ADMIN_CATALOGUE_KEY })} />
            </div>
        );
    }

    const filtering = filters.q || status !== 'all';
    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ds-muted-foreground" />
                <Label htmlFor="catalogue-search" className="sr-only">Search services</Label>
                <Input id="catalogue-search" type="search" value={filters.q} onChange={(e) => setFilters({ q: e.target.value })} placeholder="Search device or service" className="pl-9" />
            </div>
            <Label htmlFor="catalogue-status" className="sr-only">Filter by status</Label>
            <Select id="catalogue-status" value={status} onChange={(e) => setFilters({ status: e.target.value })} size="sm" wrapperClassName="sm:w-52">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Services & prices"
                description="The repairs customers can choose and their price estimates. Price changes only apply to new requests."
                actions={addButton}
            />
            <AdminDataTable
                caption="Service catalogue"
                columns={columns}
                data={visible}
                isLoading={isPending && !isPaused}
                getRowId={(row) => row.id}
                toolbar={toolbar}
                renderCard={renderCard}
                pageSize={20}
                emptyState={
                    <EmptyState
                        title={filtering ? 'No matching services' : 'No services yet'}
                        description={filtering ? 'No services match your search or filter.' : 'Add a service so customers can request it.'}
                    />
                }
            />
            <ServiceEditor
                open={editor.open}
                onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}
                definition={editor.definition}
                availablePairs={availablePairs}
                onSaved={refresh}
                onStale={refresh}
            />
        </div>
    );
};

export default ServiceCatalogue;
