import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select } from '../../ui/select';

// Presentational pagination control. Works for client-side and server-side
// (manual) pagination - the parent computes page state and callbacks.
// Shows the row range ("Showing 11-20 of 143") when the total is known, and
// falls back to "Page 2 of 8" when it is not. Hidden entirely when there is a
// single page and no page-size selector.
function DataTablePagination({
    pageIndex,
    pageCount,
    canPrevious,
    canNext,
    onPrevious,
    onNext,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    rowCount,
    totalRows,
}) {
    const selectId = useId();
    if (pageCount <= 1 && !onPageSizeChange) return null;

    const hasRange = typeof totalRows === 'number' && totalRows > 0 && typeof rowCount === 'number' && typeof pageSize === 'number';
    const start = pageIndex * (pageSize || 0) + 1;
    const end = pageIndex * (pageSize || 0) + (rowCount || 0);

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-body-sm text-ds-muted-foreground">
                {hasRange
                    ? <>Showing <span className="ds-numeric text-ds-foreground">{start}–{end}</span> of <span className="ds-numeric text-ds-foreground">{totalRows}</span></>
                    : <>Page {pageIndex + 1} of {Math.max(pageCount, 1)}</>}
            </p>
            <div className="flex items-center gap-2">
                {onPageSizeChange && pageSizeOptions ? (
                    <>
                        <label htmlFor={selectId} className="sr-only">Rows per page</label>
                        <Select
                            id={selectId}
                            size="sm"
                            value={pageSize}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                            wrapperClassName="w-32"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size} / page</option>
                            ))}
                        </Select>
                    </>
                ) : null}
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!canPrevious}>
                    <ChevronLeft aria-hidden="true" />
                    Previous
                </Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
                    Next
                    <ChevronRight aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

export { DataTablePagination };
