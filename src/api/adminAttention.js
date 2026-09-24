// "Needs attention" list (overdue-alerts phase). Admin-only; the server decides
// what is overdue, missed or unmatchable.
export async function getAdminAttention(axiosSecure) {
    return (await axiosSecure.get('/admin/attention')).data;
}
