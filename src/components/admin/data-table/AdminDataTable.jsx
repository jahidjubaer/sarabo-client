import { useState } from 'react';
import {
    useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/table';
import { Card } from '../../ui/card';
import { Skeleton } from '../../ui/skeleton';
import { TableSkeleton } from '../../common/Skeletons';
import { DataTablePagination } from './DataTablePagination';
import { DataTableViewOptions } from './DataTableViewOptions';

// Shared admin data-table foundation on TanStack Table v8 (Phase 7.5). Renders
// a real data table on lg+ and responsive cards below lg (a `renderCard` prop),
// so admin tables never squeeze many columns onto a phone or rely on horizontal
// scroll for the primary workflow. Understands columns/rows/loading/empty and
// pagination/sorting/column-visibility - business actions stay in the columns.
//
// Two modes:
//   client (default): the table sorts/paginates/filters already-loaded data.
//   manual: the parent owns server-side pagination; pass manualPagination +
//           pageCount + pageIndex + onPageChange and the given rows are shown
//           as-is (the server already returned this page). Pass totalRows too
//           so the footer can say "Showing 11-20 of 143".
//
// Accessibility (redesign Phase 1): pass `caption` (visually hidden, names the
// table for screen readers); sortable headers expose aria-sort; a header with
// no visible text (the actions column) gets its meta.label, or "Actions", as
// screen-reader text. Without `renderCard`, small screens get a generic
// label/value card built from the visible columns instead of nothing.

function ariaSort(direction) {
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return 'none';
}

function FallbackCard({ row }) {
    return (
        <Card className="p-4">
            <dl className="space-y-2">
                {row.getVisibleCells().map((cell) => {
                    const def = cell.column.columnDef;
                    const label = typeof def.header === 'string' && def.header ? def.header : def.meta?.label;
                    return (
                        <div key={cell.id} className="flex flex-col gap-0.5">
                            {label ? <dt className="text-micro font-semibold text-ds-muted-foreground">{label}</dt> : null}
                            <dd className="min-w-0 text-body-sm text-ds-foreground">{flexRender(def.cell, cell.getContext())}</dd>
                        </div>
                    );
                })}
            </dl>
        </Card>
    );
}

function SortIcon({ direction }) {
    if (direction === 'asc') return <ArrowUp aria-hidden="true" className="size-3.5" />;
    if (direction === 'desc') return <ArrowDown aria-hidden="true" className="size-3.5" />;
    return <ChevronsUpDown aria-hidden="true" className="size-3.5 opacity-50" />;
}

function LoadingBlock({ columns, rows }) {
    return (
        <>
            <div className="hidden lg:block"><TableSkeleton rows={rows} columns={Math.max(columns, 3)} /></div>
            <div className="space-y-3 lg:hidden">
                {Array.from({ length: Math.min(rows, 4) }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
            </div>
        </>
    );
}

function AdminDataTable({
    columns,
    data,
    isLoading = false,
    loadingRows = 6,
    emptyState = null,
    renderCard,
    getRowId,
    toolbar,
    enableColumnVisibility = false,
    pageSize = 10,
    pageSizeOptions = [10, 20, 50],
    globalFilter,
    onGlobalFilterChange,
    manualPagination = false,
    pageCount = 1,
    pageIndex = 0,
    onPageChange,
    totalRows,
    caption,
}) {
    const [sorting, setSorting] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [clientPagination, setClientPagination] = useState({ pageIndex: 0, pageSize });

    // TanStack Table's useReactTable returns fresh functions each render; the
    // React Compiler lint rule flags it as un-memoizable. That is expected and
    // safe here (the table drives its own render), so the advisory is silenced.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data ?? [],
        columns,
        getRowId,
        state: {
            sorting,
            columnVisibility,
            ...(onGlobalFilterChange ? { globalFilter } : {}),
            ...(manualPagination ? {} : { pagination: clientPagination }),
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        ...(onGlobalFilterChange ? { onGlobalFilterChange } : {}),
        ...(manualPagination ? {} : { onPaginationChange: setClientPagination }),
        manualSorting: manualPagination,
        getCoreRowModel: getCoreRowModel(),
        ...(manualPagination ? {} : { getSortedRowModel: getSortedRowModel() }),
        ...(onGlobalFilterChange ? { getFilteredRowModel: getFilteredRowModel() } : {}),
        ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    });

    const rows = table.getRowModel().rows;
    const visibleColumnCount = table.getVisibleLeafColumns().length;

    const pagination = manualPagination
        ? {
            pageIndex,
            pageCount: Math.max(pageCount, 1),
            canPrevious: pageIndex > 0,
            canNext: pageIndex + 1 < Math.max(pageCount, 1),
            onPrevious: () => onPageChange?.(pageIndex - 1),
            onNext: () => onPageChange?.(pageIndex + 1),
            pageSize,
            rowCount: rows.length,
            totalRows,
        }
        : {
            pageIndex: table.getState().pagination.pageIndex,
            pageCount: table.getPageCount(),
            canPrevious: table.getCanPreviousPage(),
            canNext: table.getCanNextPage(),
            onPrevious: () => table.previousPage(),
            onNext: () => table.nextPage(),
            pageSize: table.getState().pagination.pageSize,
            pageSizeOptions,
            onPageSizeChange: (size) => table.setPageSize(size),
            rowCount: rows.length,
            totalRows: table.getPrePaginationRowModel().rows.length,
        };

    return (
        <div className="space-y-4">
            {(toolbar || enableColumnVisibility) && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">{toolbar}</div>
                    {enableColumnVisibility && <div className="hidden shrink-0 lg:block"><DataTableViewOptions table={table} /></div>}
                </div>
            )}

            {isLoading ? (
                <LoadingBlock columns={visibleColumnCount} rows={loadingRows} />
            ) : rows.length === 0 ? (
                emptyState
            ) : (
                <>
                    <div className="hidden lg:block">
                        <Table>
                            {caption ? <caption className="sr-only">{caption}</caption> : null}
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                scope="col"
                                                aria-sort={header.column.getCanSort() ? ariaSort(header.column.getIsSorted()) : undefined}
                                                className={header.column.columnDef.meta?.headClassName}
                                            >
                                                {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                    <button
                                                        type="button"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="focus-ring inline-flex min-h-8 items-center gap-1 rounded-ds-sm hover:text-ds-foreground"
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        <SortIcon direction={header.column.getIsSorted()} />
                                                    </button>
                                                ) : header.column.columnDef.header ? (
                                                    flexRender(header.column.columnDef.header, header.getContext())
                                                ) : (
                                                    <span className="sr-only">{header.column.columnDef.meta?.label || 'Actions'}</span>
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="space-y-3 lg:hidden">
                        {rows.map((row) => (
                            <div key={row.id}>{renderCard ? renderCard(row.original, row) : <FallbackCard row={row} />}</div>
                        ))}
                    </div>
                </>
            )}

            {!isLoading && rows.length > 0 && <DataTablePagination {...pagination} />}
        </div>
    );
}

export { AdminDataTable };
