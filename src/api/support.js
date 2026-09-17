export const SUPPORT_MESSAGE_MAX_CHARS = 1500;
export const SUPPORT_HISTORY_MAX_MESSAGES = 8;
export const SUPPORT_CLIENT_TIMEOUT_MS = 30000;

export async function sendSupportMessage(axiosClient, { message, history }) {
    const response = await axiosClient.post('/support/chat', {
        message,
        history: history.slice(-SUPPORT_HISTORY_MAX_MESSAGES),
    }, {
        timeout: SUPPORT_CLIENT_TIMEOUT_MS,
    });
    return response.data;
}
