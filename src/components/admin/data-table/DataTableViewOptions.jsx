import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from '../../ui/dropdown-menu';

// Column visibility toggle (Phase 7.5). Only offers columns the table marks as
// hideable (core identity/action columns opt out via enableHiding:false).
function DataTableViewOptions({ table }) {
    const columns = table.getAllColumns().filter((column) => column.getCanHide());
    if (columns.length === 0) return null;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <SlidersHorizontal aria-hidden="true" />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        onSelect={(event) => event.preventDefault()}
                    >
                        {column.columnDef.meta?.label || column.id}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export { DataTableViewOptions };
