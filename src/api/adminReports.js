// Admin reports (reports phase). Admin-only; the server does all the counting.
export async function getAdminReport(axiosSecure, days) {
    return (await axiosSecure.get('/admin/reports', { params: { days } })).data;
}

// AI summary of the report: the last one written for this period (no AI call),
// or null.
export async function getAiReportSummary(axiosSecure, days) {
    return (await axiosSecure.get('/admin/reports/ai-summary', { params: { days } })).data.summary;
}

// Writes a fresh AI summary for this period from the report's own numbers.
export async function writeAiReportSummary(axiosSecure, days) {
    return (await axiosSecure.post('/admin/reports/ai-summary', { days }, { timeout: 40000 })).data.summary;
}
