import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { cn } from '../../lib/utils';

// Structural loading placeholders that approximate the shape of the real
// content, so a loading view keeps its layout instead of collapsing to a
// centred spinner. Prefer these over a full-page spinner for dashboard UIs.

function CardSkeleton({ className }) {
    return (
        <Card className={cn("space-y-3 p-5", className)}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
        </Card>
    );
}

function DetailSkeleton({ className }) {
    return (
        <div className={cn("space-y-4", className)}>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
        </div>
    );
}

function TableSkeleton({ rows = 5, columns = 4, className }) {
    return (
        <Table className={className}>
            <TableHeader>
                <TableRow>
                    {Array.from({ length: columns }).map((_, i) => (
                        <TableHead key={i}><Skeleton className="h-3 w-20" /></TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, r) => (
                    <TableRow key={r}>
                        {Array.from({ length: columns }).map((_, c) => (
                            <TableCell key={c}><Skeleton className="h-4 w-full max-w-32" /></TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export { CardSkeleton, DetailSkeleton, TableSkeleton };
