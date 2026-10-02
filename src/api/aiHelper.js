export const AI_HELPER_TEXT_MAX_CHARS = 1500;
const AI_HELPER_CLIENT_TIMEOUT_MS = 40000;

// Public: is the "describe your problem" helper switched on?
export async function getAiStatus(axiosPublic) {
    return (await axiosPublic.get('/ai/status')).data;
}

// Signed-in customers only. `photo` is optional ({ mimeType, data } from
// shrinkPhotoForAi). Returns the draft: form-ready values, any of which may be
// null when the AI could not tell, plus `photo` ({ showsDevice, finding }) when
// a photo was sent.
export async function requestAiDraft(axiosSecure, { text, photo }) {
    const body = photo ? { text, photo } : { text };
    const response = await axiosSecure.post('/ai/request-draft', body, { timeout: AI_HELPER_CLIENT_TIMEOUT_MS });
    return response.data.draft;
}

export function getAiHelperErrorMessage(error) {
    const message = error?.response?.data?.message;
    if (typeof message === 'string' && message.length > 0 && message.length < 200) return message;
    if (error?.response?.status === 413) return 'The photo is too large. Please choose a smaller one.';
    if (error?.code === 'ECONNABORTED') return 'The AI helper took too long. Please try again or fill in the form yourself.';
    return 'The AI helper could not help right now. Please fill in the form yourself.';
}
