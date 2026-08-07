import { Button } from '../../ui/button';

// Presentational pagination control (Phase 7.5). Works for both client-side and
// server-side (manual) pagination - the parent computes the page state and the
// callbacks. Labelled controls; hidden entirely when there is a single page and
// no page-size selector.
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
}) {
    if (pageCount <= 1 && !onPageSizeChange) return null;
    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-ds-muted-foreground" role="status">
                Page {pageIndex + 1} of {Math.max(pageCount, 1)}
            </p>
            <div className="flex items-center gap-2">
                {onPageSizeChange && pageSizeOptions ? (
                    <>
                        <label htmlFor="rows-per-page" className="sr-only">Rows per page</label>
                        <select
                            id="rows-per-page"
                            value={pageSize}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                            className="h-9 rounded-ds border border-ds-input bg-ds-background px-2 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size} / page</option>
                            ))}
                        </select>
                    </>
                ) : null}
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!canPrevious} aria-label="Previous page">Previous</Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext} aria-label="Next page">Next</Button>
            </div>
        </div>
    );
}

export { DataTablePagination };
