// Admin reports (reports phase). Admin-only; the server does all the counting.
export async function getAdminReport(axiosSecure, days) {
    return (await axiosSecure.get('/admin/reports', { params: { days } })).data;
}
