// V2 repair-request creation (Phase 6.4 Unit 3A). POST /parcels requires
// verifyFBToken (see sarabo-server's routes/parcels.js), so this always
// takes the caller's own axiosSecure instance. `payload` is expected to
// already be the whitelisted shape from
// src/utils/repairRequestV2Form.js#buildRepairRequestV2Payload - this
// function never spreads, reshapes, or adds fields to it (in particular,
// never adds senderEmail/role/pricing - ownership comes from the verified
// token server-side, pricing is entirely server-derived).
//
// The server's insertOne-based response is `{ acknowledged, insertedId }`
// (see models/Parcel.js#create) - no trackingId/parcelName/etc. are
// returned. A response missing a valid string insertedId is treated as a
// controlled client error, never fabricated into a usable id, and never
// used to trigger the image-upload flow.
export async function createRepairRequestV2(axiosSecure, payload) {
    const res = await axiosSecure.post('/parcels', payload);
    const insertedId = res?.data?.insertedId;
    if (typeof insertedId !== 'string' || insertedId.trim().length === 0) {
        throw Object.assign(new Error('malformed create-request response'), { isMalformedSuccessResponse: true });
    }
    return { requestId: insertedId };
}
