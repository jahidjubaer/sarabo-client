import { validFeedbackId } from './technicianFeedback';

export const RATING_LABELS = { 1: 'Very poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' };
export const validRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;
export const hasCustomerFeedback = (data) => !!data && typeof data.reviewEligibility?.eligible === 'boolean'
    && Object.hasOwn(data, 'ownReview') && (data.ownReview === null || (validFeedbackId(data.ownReview?._id) && validRating(data.ownReview?.rating)))
    && Array.isArray(data.reportTargets) && data.reportTargets.every((target) => target && typeof target.technicianName === 'string' && (target.assignmentId === null || validFeedbackId(target.assignmentId)))
    && Array.isArray(data.reports);

export function validateCustomerFeedbackText(value, minimum, maximum) {
    const text = value.trim();
    if (text.length < minimum) return `Enter at least ${minimum} characters, excluding surrounding spaces.`;
    if (text.length > maximum) return `Use ${maximum.toLocaleString('en')} characters or fewer.`;
    const unsafeControl = [...text].some((character) => {
        const code = character.charCodeAt(0);
        return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
    });
    return unsafeControl || /<\/?[a-z!][^>]*>/i.test(text) ? 'Use plain text without HTML or markup.' : '';
}

export function customerFeedbackError(error, kind) {
    const code = error?.response?.data?.code;
    if (error?.response?.status === 409 && code === 'REVIEW_ALREADY_EXISTS') return 'A review already exists for this repair. Close this dialog to see the latest feedback.';
    if (error?.response?.status === 409 && code === 'REPORT_ALREADY_EXISTS') return 'This technician has already been reported for this repair. Close this dialog to see your report summaries.';
    if (code === 'EMAIL_NOT_VERIFIED') return 'Verify your email before submitting a review. Reporting an issue does not require email verification.';
    if (error?.response?.status === 409) return `This repair is no longer eligible for this ${kind}. Close this dialog and review the refreshed feedback options.`;
    if (error?.response?.status === 404) return 'This repair is unavailable. Return to your requests before continuing.';
    if ([401, 403].includes(error?.response?.status) || error?.code === 'FEEDBACK_SESSION_CHANGED') return 'Your account access changed. Sign in to the repair owner’s account before continuing.';
    if (error?.response?.status === 400) return 'The submission was not accepted. Check the rating or text and try again.';
    return 'Your submission could not be confirmed. Close this dialog and refresh feedback before trying again.';
}

export const feedbackFailureNeedsRefresh = (error) => error?.response?.status !== 400;
