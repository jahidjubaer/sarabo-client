import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { useAdminFeedbackList } from '../../../hooks/useTechnicianFeedback';
import { feedbackCacheGeneration } from '../../../hooks/technicianFeedbackKeys';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { Button } from '../../../components/ui/button';
import { AdminDataTable } from '../../../components/admin/data-table/AdminDataTable';
import { FeedbackBadge, FeedbackDate, FeedbackFilters, FeedbackReference, FeedbackRefreshState, FeedbackUnavailable } from '../../../components/feedback/admin/FeedbackPrimitives';
import ReportDetailSheet from '../../../components/feedback/admin/ReportDetailSheet';
import ReviewDetailSheet from '../../../components/feedback/admin/ReviewDetailSheet';
import { feedbackReadState, hasFeedbackPage, REPORT_REASONS, REPORT_STATUSES, REVIEW_VISIBILITY } from '../../../utils/technicianFeedback';

function FeedbackWorkspace({ kind }) {
    const reports = kind === 'reports';
    const [filters, setFilters] = useState({ page: 1, limit: 20 });
    const [selectedId, setSelectedId] = useState(null);
    const returnFocus = useRef(null);
    const fallbackFocus = useRef(null);
    const client = useQueryClient();
    const query = useAdminFeedbackList(kind, filters);
    const state = feedbackReadState(query, hasFeedbackPage(query.data));
    // Missing data is not an empty page; this fallback is used for skeletons only.
    const page = state === 'ready' ? query.data : null;
    const items = page?.items ?? [];
    const canModerate = !!page && !query.isFetching && !query.isError && query.fetchStatus !== 'paused';
    const openDetail = (record, event) => { returnFocus.current = event.currentTarget; setSelectedId(record._id); };
    const action = (record) => <Button variant="outline" size="sm" aria-label={`Inspect ${reports ? 'report' : 'review'} ${record._id}`} onClick={(event) => openDetail(record, event)}>Inspect</Button>;
    const columns = (reports ? [
        { id: 'report', header: 'Report / reason', cell: ({ row: { original: r } }) => <div className="max-w-48 space-y-1"><p className="whitespace-normal font-medium">{REPORT_REASONS[r.reason]}</p><FeedbackReference value={r._id} /></div> },
        { id: 'accounts', header: 'Account references', cell: ({ row: { original: r } }) => <div className="max-w-44 space-y-2"><p className="text-xs">Technician<br /><FeedbackReference value={r.technicianId} /></p><p className="text-xs">Customer<br /><FeedbackReference value={r.customerId} /></p></div> },
        { id: 'state', header: 'Status', cell: ({ row }) => <FeedbackBadge value={row.original.status} /> },
        { id: 'created', header: 'Created', cell: ({ row }) => <FeedbackDate value={row.original.createdAt} /> },
        { id: 'updated', header: 'Updated', cell: ({ row }) => <FeedbackDate value={row.original.updatedAt} /> },
    ] : [
        { id: 'rating', header: 'Rating', cell: ({ row }) => <span className="whitespace-nowrap font-medium">{row.original.rating} / 5</span> },
        { id: 'comment', header: 'Comment', cell: ({ row }) => <p className="max-w-xs whitespace-normal break-words [overflow-wrap:anywhere]">{row.original.comment ? `${row.original.comment.slice(0, 120)}${row.original.comment.length > 120 ? '…' : ''}` : 'No comment'}</p> },
        { id: 'technician', header: 'Technician reference', cell: ({ row }) => <div className="max-w-44"><FeedbackReference value={row.original.technicianId} /></div> },
        { id: 'visibility', header: 'Visibility', cell: ({ row }) => <FeedbackBadge value={row.original.visibility} /> },
        { id: 'created', header: 'Created', cell: ({ row }) => <FeedbackDate value={row.original.createdAt} /> },
    ]).concat([{ id: 'action', header: 'Action', cell: ({ row }) => action(row.original) }]).map((column) => ({ ...column, enableSorting: false }));
    const renderCard = (record) => (
        <article className="space-y-3 rounded-ds-lg border border-ds-border bg-ds-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-sm font-semibold">{reports ? REPORT_REASONS[record.reason] : `Rating: ${record.rating} / 5`}</h2><FeedbackBadge value={reports ? record.status : record.visibility} /></div>
            <dl className="space-y-2 text-sm">
                <div><dt className="text-xs font-medium">{reports ? 'Report' : 'Review'} reference</dt><dd><FeedbackReference value={record._id} /></dd></div>
                <div><dt className="text-xs font-medium">Technician reference</dt><dd><FeedbackReference value={record.technicianId} /></dd></div>
                {reports && <div><dt className="text-xs font-medium">Customer reference</dt><dd><FeedbackReference value={record.customerId} /></dd></div>}
                <div><dt className="text-xs font-medium">Created</dt><dd><FeedbackDate value={record.createdAt} /></dd></div>
                {reports && <div><dt className="text-xs font-medium">Updated</dt><dd><FeedbackDate value={record.updatedAt} /></dd></div>}
            </dl>
            {!reports && <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{record.comment || 'No comment provided.'}</p>}
            {action(record)}
        </article>
    );
    const selectedFilter = reports ? REPORT_STATUSES[filters.status] : REVIEW_VISIBILITY[filters.visibility];
    return (
        <div className="min-w-0 space-y-6">
            <PageHeader title={reports ? 'Technician reports' : 'Technician reviews'}
                description={reports ? 'Private reports for Admin review. Handling a report does not change assignments, accounts, payments, or earnings.' : 'Review customer feedback and moderate visibility. Original ratings and comments remain unchanged.'} />
            <FeedbackFilters kind={kind} filters={filters} onChange={(next) => { setSelectedId(null); setFilters(next); }} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ds-muted-foreground">{page ? `${page.total} matching ${kind} · Page ${page.page}` : 'Moderation records'} · Newest first · 20 per page</p>
                <Button ref={fallbackFocus} variant="outline" size="sm" disabled={query.isFetching}
                    onClick={() => client.invalidateQueries({ queryKey: query.queryKey, exact: true })}>Refresh list</Button>
            </div>
            {state === 'unavailable' ? <FeedbackUnavailable query={query} /> : <>
                {page && <FeedbackRefreshState query={query} />}
                {state === 'loading' && <p role="status" className="sr-only">Loading technician {kind}…</p>}
                <AdminDataTable caption={reports ? 'Technician reports' : 'Technician reviews'} totalRows={page?.total} columns={columns} data={items} isLoading={state === 'loading'} getRowId={(row) => row._id} renderCard={renderCard}
                    manualPagination pageSize={20} pageIndex={filters.page - 1} pageCount={page ? Math.max(1, Math.ceil(page.total / page.limit)) : 1}
                    onPageChange={(index) => { setSelectedId(null); setFilters({ ...filters, page: index + 1 }); }}
                    emptyState={<EmptyState title={filters.page > 1 ? 'No records on this page' : `No ${selectedFilter ? `${selectedFilter.toLowerCase()} ` : ''}technician ${kind}`}
                        description={filters.technicianId ? 'No records match the current Technician filter.' : 'Only records matching the selected filter are shown.'}
                        action={filters.page > 1 ? <Button variant="outline" onClick={() => setFilters({ ...filters, page: 1 })}>Go to first page</Button> : undefined} />} />
            </>}
            {selectedId && (reports
                ? <ReportDetailSheet key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} returnFocusRef={returnFocus} fallbackFocusRef={fallbackFocus} />
                : <ReviewDetailSheet key={selectedId} review={items.find((item) => item._id === selectedId)} canModerate={canModerate}
                    onClose={() => setSelectedId(null)} returnFocusRef={returnFocus} fallbackFocusRef={fallbackFocus} />)}
        </div>
    );
}

export default function AdminFeedbackPage({ kind }) {
    const { user } = useAuth();
    const client = useQueryClient();
    // Discard selections/drafts on account changes and explicit re-authentication.
    return <FeedbackWorkspace key={`${user?.uid ?? 'signed-out'}:${kind}:${feedbackCacheGeneration(client)}`} kind={kind} />;
}
