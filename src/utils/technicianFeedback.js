export const REPORT_STATUSES = { open: 'Open', under_review: 'Under review', resolved: 'Resolved', dismissed: 'Dismissed' };
export const REVIEW_VISIBILITY = { visible: 'Visible', hidden: 'Hidden' };
export const REPORT_REASONS = {
    unprofessional_behavior: 'Unprofessional behavior', suspected_fraud: 'Suspected fraud',
    device_damage: 'Device damage', missing_item: 'Missing item', harassment: 'Harassment',
    safety_concern: 'Safety concern', payment_issue: 'Payment issue', repair_dispute: 'Repair dispute', other: 'Other',
};
export const REPORT_ACTIONS = { under_review: 'Start review', resolved: 'Resolve report', dismissed: 'Dismiss report' };
export const allowedReportTransitions = (status) => ({ open: ['under_review', 'dismissed'], under_review: ['resolved', 'dismissed'] })[status] ?? [];
export const validFeedbackId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value);
export const hasFeedbackPage = (data) => !!data && Array.isArray(data.items) && Number.isInteger(data.total)
    && Number.isInteger(data.page) && Number.isInteger(data.limit);
export const hasReportDetail = (data) => !!data && validFeedbackId(data._id) && Number.isInteger(data.version)
    && Object.hasOwn(REPORT_STATUSES, data.status) && Array.isArray(data.adminNotes) && Array.isArray(data.statusHistory);

export const hasTechnicianReviewPage = (data) => hasFeedbackPage(data)
    && Number.isInteger(data.reviewCount) && data.reviewCount >= 0
    && (data.reviewCount === 0 ? data.averageRating === null : Number.isFinite(data.averageRating) && data.averageRating >= 1 && data.averageRating <= 5);

export function feedbackReadState(query, usable) {
    if (usable) return 'ready';
    if (query.fetchStatus === 'fetching' && !query.isError) return 'loading';
    return 'unavailable';
}

export function validateModerationText(value) {
    const text = value.trim();
    if (!text.length) return 'Enter a reason or note before continuing.';
    if (text.length > 1000) return 'Use 1,000 characters or fewer.';
    const unsafeControl = [...text].some((character) => {
        const code = character.charCodeAt(0);
        return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
    });
    if (unsafeControl || /<\/?[a-z!][^>]*>/i.test(text)) return 'Use plain text without markup or control characters.';
    return '';
}

export function feedbackMutationError(error) {
    if (error?.response?.status === 409) return 'This record changed elsewhere. Review the refreshed record before trying again.';
    if ([401, 403].includes(error?.response?.status) || error?.code === 'FEEDBACK_SESSION_CHANGED') return 'Your Admin session changed. Sign in again before continuing.';
    if (error?.response?.status === 404) return 'This record is no longer available. Refresh the list before continuing.';
    if (error?.response?.status === 400) return 'The change could not be accepted. Check the input and refresh the record before trying again.';
    return 'The change could not be confirmed. Refresh and review the record before trying again.';
}
