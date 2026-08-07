// Public, unauthenticated service-catalogue API (Phase 6.4 Unit 3A) - GET
// /service-definitions and GET /service-definitions/:id require no
// verifyFBToken on the server (see sarabo-server's routes/serviceDefinitions.js),
// so this module takes the caller's own public axios instance
// (src/hooks/useAxios.jsx), never axiosSecure. Server response shapes are
// returned as-is, never wrapped or reshaped.
export async function getServiceDefinitions(axiosPublic, filters = {}) {
    const params = {};
    if (filters.productCategorySlug) params.productCategorySlug = filters.productCategorySlug;
    if (filters.repairCategorySlug) params.repairCategorySlug = filters.repairCategorySlug;
    const res = await axiosPublic.get('/service-definitions', { params });
    return res.data;
}

export async function getServiceDefinitionById(axiosPublic, id) {
    const res = await axiosPublic.get(`/service-definitions/${encodeURIComponent(id)}`);
    return res.data;
}
