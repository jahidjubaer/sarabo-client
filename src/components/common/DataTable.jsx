import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { TableSkeleton } from './Skeletons';
import { EmptyState } from './EmptyState';

// Presentation-only table foundation. Renders a column-config-driven table and
// folds in the three states every list needs - loading (skeleton), empty
// (EmptyState), and data - plus horizontal-overflow protection (inherited from
// the Table primitive) so it never breaks a mobile layout.
//
// It is deliberately NOT a data grid: no built-in sorting, filtering, or
// pagination. Those belong to the individual dashboard units that need them;
// this only standardizes structure and the empty/loading handling.
//
// `columns`: [{ key, header, cell?(row)=>node, accessor?, headClassName?, cellClassName? }]
function DataTable({ columns, data, isLoading = false, loadingRows = 5, empty, getRowKey, className }) {
    if (isLoading) {
        return <TableSkeleton rows={loadingRows} columns={columns.length} className={className} />;
    }

    if (!data || data.length === 0) {
        return empty ?? <EmptyState title="Nothing to show" description="There are no records to display yet." />;
    }

    return (
        <Table className={className}>
            <TableHeader>
                <TableRow>
                    {columns.map((col) => (
                        <TableHead key={col.key} className={col.headClassName}>{col.header}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={getRowKey ? getRowKey(row, index) : index}>
                        {columns.map((col) => (
                            <TableCell key={col.key} className={col.cellClassName}>
                                {col.cell ? col.cell(row) : row[col.accessor ?? col.key]}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export { DataTable };
