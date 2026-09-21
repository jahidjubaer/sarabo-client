import { useId, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { useAdminReport, useFeedbackMutation } from '../../../hooks/useTechnicianFeedback';
import { allowedReportTransitions, feedbackMutationError, feedbackReadState, hasReportDetail, REPORT_ACTIONS, REPORT_REASONS, REPORT_STATUSES, validateModerationText } from '../../../utils/technicianFeedback';
import { FeedbackBadge, FeedbackDate, FeedbackReference, FeedbackRefreshState, FeedbackUnavailable } from './FeedbackPrimitives';
import ModerationDialog from './ModerationDialog';

export default function ReportDetailSheet({ id, onClose, returnFocusRef, fallbackFocusRef }) {
    const query = useAdminReport(id);
    const noteMutation = useFeedbackMutation('note');
    const statusMutation = useFeedbackMutation('status');
    const [action, setAction] = useState(null);
    const [note, setNote] = useState('');
    const [noteError, setNoteError] = useState('');
    const [noteFailed, setNoteFailed] = useState(false);
    const [message, setMessage] = useState('');
    const actionFocus = useRef(null);
    const statusHeading = useRef(null);
    const noteId = useId();
    const state = feedbackReadState(query, hasReportDetail(query.data));
    const report = state === 'ready' ? query.data : null;
    const busy = noteMutation.isPending || statusMutation.isPending;
    const canModerate = !!report && !busy && !query.isFetching && !query.isError && query.fetchStatus !== 'paused';
    const submitNote = async (event) => {
        event.preventDefault();
        if (!canModerate || noteFailed) return;
        const error = validateModerationText(note);
        if (error) { setNoteError(error); return; }
        setNoteError(''); setMessage('');
        try {
            await noteMutation.mutateAsync({ id, text: note.trim(), expectedVersion: report.version });
            setNote(''); setMessage('Private note added.');
        } catch (caught) { setNoteError(feedbackMutationError(caught)); setNoteFailed(true); }
    };
    return (
        <Sheet open onOpenChange={(open) => { if (!open && !busy && !action) onClose(); }}>
            <SheetContent className="w-full max-w-full sm:max-w-2xl" showCloseButton={!busy && !action}
                onCloseAutoFocus={(event) => { event.preventDefault(); (returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef.current)?.focus(); }}>
                <SheetHeader className="border-b border-ds-border pr-12">
                    <SheetTitle>Technician report</SheetTitle>
                    <SheetDescription>Private Admin workspace. Reports do not automatically change technician, repair, or financial state.</SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                    {state === 'loading' && <p role="status">Loading report…</p>}
                    {state === 'unavailable' && <FeedbackUnavailable query={query} title="Report unavailable" />}
                    {report && <>
                        <FeedbackRefreshState query={query} />
                        <section className="space-y-3" aria-labelledby={`${noteId}-status`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 id={`${noteId}-status`} ref={statusHeading} tabIndex={-1} className="font-semibold focus-ring">Report handling</h3>
                                <FeedbackBadge value={report.status} />
                            </div>
                            <p className="text-sm text-ds-muted-foreground">Resolved means Admin handling is complete, not a finding of guilt or approval of compensation. Dismissed means closed without further action.</p>
                            <div className="flex flex-wrap gap-2">
                                {allowedReportTransitions(report.status).map((status) => <Button key={status} variant="outline" disabled={!canModerate}
                                    onClick={(event) => { actionFocus.current = event.currentTarget; setMessage(''); setAction({ status, version: report.version }); }}>
                                    {REPORT_ACTIONS[status]}
                                </Button>)}
                            </div>
                            {!allowedReportTransitions(report.status).length && <p className="text-sm text-ds-muted-foreground">This report is closed. It cannot be reopened.</p>}
                            <p role="status" className="text-sm text-ds-primary">{message}</p>
                        </section>
                        <dl className="grid gap-4 rounded-ds-lg border border-ds-border bg-ds-card p-4 text-sm sm:grid-cols-2">
                            {[['Report reference', report._id], ['Repair reference', report.repairRequestId], ['Technician reference', report.technicianId], ['Customer reference', report.customerId], ['Assignment reference', report.assignmentId]].map(([label, value]) =>
                                <div key={label} className="min-w-0"><dt className="mb-1 font-medium">{label}</dt><dd><FeedbackReference value={value} /></dd></div>)}
                            <div><dt className="mb-1 font-medium">Version</dt><dd>{report.version}</dd></div>
                            <div><dt className="mb-1 font-medium">Created</dt><dd><FeedbackDate value={report.createdAt} /></dd></div>
                            <div><dt className="mb-1 font-medium">Updated</dt><dd><FeedbackDate value={report.updatedAt} /></dd></div>
                            {report.closedAt && <><div><dt className="mb-1 font-medium">Closed</dt><dd><FeedbackDate value={report.closedAt} /></dd></div>
                                <div className="min-w-0"><dt className="mb-1 font-medium">Closed by Admin</dt><dd><FeedbackReference value={report.closedBy} /></dd></div></>}
                        </dl>
                        <section className="space-y-2"><h3 className="font-semibold">{REPORT_REASONS[report.reason] ?? 'Report description'}</h3>
                            <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{report.description}</p>
                        </section>
                        <section className="space-y-4" aria-labelledby={`${noteId}-notes`}>
                            <h3 id={`${noteId}-notes`} className="font-semibold">Private admin notes</h3>
                            <p className="text-sm text-ds-muted-foreground">Visible only to Admins. Notes are append-only and cannot be edited or deleted.</p>
                            {report.adminNotes.length ? <ol className="space-y-3">{report.adminNotes.map((entry, index) => <li key={index} className="space-y-2 rounded-ds-lg border border-ds-border bg-ds-card p-3">
                                <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{entry.text}</p>
                                <p className="text-xs text-ds-muted-foreground">Admin: <FeedbackReference value={entry.adminId} /></p>
                                <FeedbackDate value={entry.createdAt} />
                            </li>)}</ol> : <p className="text-sm text-ds-muted-foreground">No private notes yet.</p>}
                            <form onSubmit={submitNote} className="space-y-2">
                                <Label htmlFor={noteId}>Add a private admin note</Label>
                                <Textarea id={noteId} rows={4} maxLength={1000} required value={note} disabled={busy || noteFailed}
                                    onChange={(event) => { setNote(event.target.value); setNoteError(''); }} aria-invalid={!!noteError} aria-describedby={`${noteId}-help ${noteId}-error`} />
                                <p id={`${noteId}-help`} className="text-xs text-ds-muted-foreground">Plain text, up to 1,000 characters. {note.length}/1,000</p>
                                <p id={`${noteId}-error`} role={noteError ? 'alert' : undefined} className="text-sm text-ds-destructive">{noteError}</p>
                                {noteFailed ? <Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal" disabled={!canModerate} onClick={() => { setNote(''); setNoteError(''); setNoteFailed(false); }}>Discard draft and use refreshed record</Button>
                                    : <Button type="submit" disabled={!canModerate}>{noteMutation.isPending ? 'Adding note…' : 'Add note'}</Button>}
                            </form>
                        </section>
                        <section className="space-y-3"><h3 className="font-semibold">Status history</h3>
                            {report.statusHistory.length ? <ol className="space-y-3">{report.statusHistory.map((entry, index) => <li key={index} className="space-y-1 border-l-2 border-ds-border pl-3 text-sm">
                                <p>{REPORT_STATUSES[entry.from] ?? 'Created'} → {REPORT_STATUSES[entry.to] ?? entry.to}</p>
                                <p>Admin: <FeedbackReference value={entry.adminId} /></p><FeedbackDate value={entry.createdAt} />
                            </li>)}</ol> : <p className="text-sm text-ds-muted-foreground">No status changes yet.</p>}
                        </section>
                    </>}
                </div>
                {action && <ModerationDialog title={REPORT_ACTIONS[action.status]}
                    description={action.status === 'under_review' ? 'Record that Admin review has started. No technician or financial action will be taken.' : 'Close this report with a private explanation. This does not trigger disciplinary or financial action and cannot be undone.'}
                    requireText={action.status !== 'under_review'} textLabel="Private admin explanation"
                    returnFocusRef={actionFocus} fallbackFocusRef={statusHeading}
                    onClose={() => setAction(null)} onConfirm={async (explanation) => {
                        await statusMutation.mutateAsync({ id, status: action.status, expectedVersion: action.version, ...(explanation ? { explanation } : {}) });
                        setMessage('Report status updated.');
                    }} />}
            </SheetContent>
        </Sheet>
    );
}
