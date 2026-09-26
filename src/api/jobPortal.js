// Job portal (job-portal phase B). The server decides who sees what and
// re-checks every action.
export async function getJobPortal(axiosSecure) {
    return (await axiosSecure.get('/technician/job-portal')).data;
}

export async function applyForJob(axiosSecure, requestId, application) {
    return (await axiosSecure.post(`/repair-requests/${requestId}/applications`, application)).data;
}

export async function withdrawApplication(axiosSecure, requestId) {
    return (await axiosSecure.post(`/repair-requests/${requestId}/applications/mine/withdraw`)).data;
}

export async function getRequestApplications(axiosSecure, requestId) {
    return (await axiosSecure.get(`/repair-requests/${requestId}/applications`)).data;
}

export async function acceptApplication(axiosSecure, requestId, applicationId) {
    return (await axiosSecure.post(`/repair-requests/${requestId}/applications/${applicationId}/accept`)).data;
}

export async function inviteTechnician(axiosSecure, requestId, technicianId) {
    return (await axiosSecure.post(`/admin/repair-requests/${requestId}/invite`, { technicianId })).data;
}
