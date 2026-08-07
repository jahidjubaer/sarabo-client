import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { FaHistory, FaCreditCard, FaArrowLeft, FaBan } from 'react-icons/fa';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import { humanizeStatus } from '../../../utils/statusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getRepairStatusLabel } from '../../../utils/repairStatus';
import { getCancellationErrorMessage } from '../../../utils/cancellationErrorMessage';
import { canCancelRequest } from '../../../utils/cancellationEligibility';
import { canEditDamageImages } from '../../../utils/damageImageValidation';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';
import { formatMoneyRange } from '../../../utils/currency';
import DamageImageManager from '../../../components/damage-images/DamageImageManager';
import InspectionSection from '../../../components/inspection/InspectionSection';
import QuoteSection from '../../../components/quote/QuoteSection';
import V2PaymentSection from '../../../components/payment/V2PaymentSection';

// Formats a v2 request's server-stored pricing snapshot (`request.pricing`,
// shape { currency, estimateMin, estimateMax, ... } - built by
// sarabo-server's controllers/parcelController.js#createRepairRequestV2).
// The snapshot's own persisted currency drives formatting via the shared
// currency util - never a conversion: a new BDT request renders as taka
// ("৳500 – ৳800 (estimate)"), while a historical USD snapshot still renders
// as dollars. The snapshot's field names (estimateMin/estimateMax) differ
// from the public catalogue's pricingEstimate (min/max), so the endpoints are
// passed explicitly here.
function formatV2PricingEstimate(pricing) {
    if (!pricing || typeof pricing.estimateMin !== 'number' || typeof pricing.estimateMax !== 'number') return 'Pending';
    const range = formatMoneyRange(pricing.estimateMin, pricing.estimateMax, pricing.currency);
    return range ? `${range} (estimate)` : 'Pending';
}

const RequestDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [cancelling, setCancelling] = useState(false);
    // This same page is reused from three entry points (see routes/router.jsx):
    // the customer's own my-requests/:id, the admin's read-only
    // manage-repair-requests/:id, and the assigned technician's
    // assigned-jobs/:id (Phase 6.4 Unit 4) - the back link and not-found
    // fallback should return to whichever list the viewer actually came from.
    const isAdminContext = location.pathname.startsWith('/dashboard/manage-repair-requests');
    const isTechnicianContext = location.pathname.startsWith('/dashboard/assigned-jobs');
    const backTo = isAdminContext ? '/dashboard/manage-repair-requests' : (isTechnicianContext ? '/dashboard/assigned-jobs' : '/dashboard/my-requests');
    const backLabel = isAdminContext ? 'Back to Manage Repair Requests' : (isTechnicianContext ? 'Back to Assigned Repairs' : 'Back to My Repair Requests');

    const { data: request, isLoading, isError, refetch } = useQuery({
        queryKey: ['parcels', id],
        queryFn: async () => {
            const res = await axiosSecure.get(`/parcels/${id}`);
            return res.data;
        },
        retry: false
    })

    if (isLoading) {
        return <Loading></Loading>
    }

    if (isError || !request) {
        return (
            <div>
                <h2 className="text-4xl font-bold">Repair request not found</h2>
                <p className="mt-4 opacity-70">This request may have been removed, or you may not have access to it.</p>
                <Link to={backTo} className="btn btn-outline mt-6">
                    <FaArrowLeft aria-hidden="true" /> {backLabel}
                </Link>
            </div>
        );
    }

    const isCancelled = request.deliveryStatus === 'cancelled';
    // Paying and cancelling are actions only the request's own customer can
    // take - the server already enforces ownership on both endpoints, but an
    // admin or technician viewing this same page (see routes/router.jsx's
    // manage-repair-requests/:id route) should never see buttons that would
    // just fail with a 403. Admin request-management is read-only here by
    // design (no admin cancellation override, no pay-on-behalf-of).
    const isOwner = request.senderEmail === user?.email;
    // Damage-evidence photos (Phase 6.4) only exist for v2 requests - never
    // inferred from field presence, the same "schemaVersion is the single
    // source of truth" rule the server itself enforces. `canEdit` is only
    // ever true for the request's own (non-admin-context) owner, and is
    // still re-confirmed independently inside DamageImageManager against
    // the server's own accessRole before any upload/delete control renders.
    const isV2Request = request.schemaVersion === 2;
    const damageImagesEditable = isOwner && !isAdminContext && canEditDamageImages(request);
    // Technician inspection (Phase 6.4 Unit 4). The submission form is offered
    // only to the assigned technician (viewing via the TechnicianRoute-gated
    // assigned-jobs/:id path) on a picked-up v2 request - the server always
    // independently revalidates role, assignment, lifecycle, and single-
    // submission at commit time, so this is purely a UX gate.
    const isAssignedTechnicianView = isV2Request && isTechnicianContext && request.riderEmail === user?.email;
    const canInspect = isAssignedTechnicianView && request.deliveryStatus === 'parcel_picked_up';
    // Quote submission (Phase 6.4 Unit 5) - offered to the assigned technician
    // once the inspection is completed. The server always revalidates.
    const canSubmitQuote = isAssignedTechnicianView && request.deliveryStatus === 'inspection_completed';

    const handleCancelRequest = () => {
        if (cancelling) return;

        Swal.fire({
            title: 'Cancel this repair request?',
            text: "This is final - once cancelled, this request cannot be reopened. Assigned or in-progress repairs can no longer be cancelled here, and paid requests require support for cancellation or a refund.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel request'
        }).then(result => {
            if (!result.isConfirmed) return;

            setCancelling(true);
            axiosSecure.patch(`/parcels/${id}/cancel`)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['parcels', id] });
                    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
                    refetch();
                    Swal.fire({
                        title: 'Request Cancelled',
                        text: 'Your repair request has been cancelled.',
                        icon: 'success'
                    });
                })
                .catch(error => {
                    if (import.meta.env.DEV) console.error('Cancellation failed:', error);
                    Swal.fire({ icon: 'error', title: 'Could not cancel request', text: getCancellationErrorMessage(error) });
                })
                .finally(() => setCancelling(false));
        });
    };

    return (
        <div>
            <h2 className="text-4xl font-bold">Repair Request Details</h2>
            <p className="opacity-70 mt-2">Request ID: {request.trackingId}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Device</h3>
                    {isV2Request ? (
                        <>
                            <p><span className="font-semibold">Product Category:</span> {humanizeSlug(request.product?.categorySlug || '')}</p>
                            {request.product?.brand && <p><span className="font-semibold">Brand:</span> {request.product.brand}</p>}
                            {request.product?.model && <p><span className="font-semibold">Model:</span> {request.product.model}</p>}
                            {request.product?.serialNumber && <p><span className="font-semibold">Serial Number:</span> {request.product.serialNumber}</p>}
                            {request.damage?.description && <p className="mt-2"><span className="font-semibold">Problem:</span> {request.damage.description}</p>}
                        </>
                    ) : (
                        <>
                            <p><span className="font-semibold">Device Name:</span> {request.parcelName}</p>
                            {request.parcelWeight && <p><span className="font-semibold">Weight:</span> {request.parcelWeight} kg</p>}
                            {request.receiverEmail && <p><span className="font-semibold">Brand / Model:</span> {request.receiverEmail}</p>}
                            {request.receiverRegion && <p><span className="font-semibold">Category:</span> {request.receiverRegion}</p>}
                            {request.priority && <p><span className="font-semibold">Priority:</span> {humanizeStatus(request.priority)}</p>}
                            {request.receiverAddress && <p className="mt-2"><span className="font-semibold">Problem:</span> {request.receiverAddress}</p>}
                        </>
                    )}
                </div>

                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Customer & Service Address</h3>
                    {isV2Request ? (
                        <>
                            <p><span className="font-semibold">Email:</span> {request.senderEmail}</p>
                            <p><span className="font-semibold">Address:</span> {request.serviceLocation?.address}, {request.serviceLocation?.district}, {request.serviceLocation?.region}</p>
                        </>
                    ) : (
                        <>
                            <p><span className="font-semibold">Name:</span> {request.senderName}</p>
                            <p><span className="font-semibold">Email:</span> {request.senderEmail}</p>
                            {request.senderPhone && <p><span className="font-semibold">Phone:</span> {request.senderPhone}</p>}
                            <p><span className="font-semibold">Address:</span> {request.senderAddress}, {request.senderDistrict}, {request.senderRegion}</p>
                            {request.visitInstructions && <p className="mt-2"><span className="font-semibold">Visit Instructions:</span> {request.visitInstructions}</p>}
                        </>
                    )}
                </div>

                <div className="card bg-base-200 p-6">
                    <h3 className="text-2xl font-semibold mb-4">Status & Payment</h3>
                    <p><span className="font-semibold">Repair Status:</span> <StatusBadge status={request.deliveryStatus || 'pending-pickup'} label={getRepairStatusLabel(request.deliveryStatus)} /></p>
                    <p><span className="font-semibold">Repair Cost:</span> {isV2Request ? formatV2PricingEstimate(request.pricing) : formatCurrency(request.cost)}</p>
                    <p><span className="font-semibold">Payment:</span> <StatusBadge status={request.paymentStatus || 'unpaid'} /></p>
                    {request.riderName && <p><span className="font-semibold">Assigned Technician:</span> {request.riderName}</p>}
                </div>
            </div>

            {isV2Request && (
                <div className="card bg-base-200 p-6 mt-8">
                    <h3 className="text-2xl font-semibold mb-4">Damage Photos</h3>
                    {/* Only requestId is passed down - the raw `request`
                        object's own damage.images (url/storageKey, see
                        BL-032 debt) is never read here or handed to this
                        component; every image shown comes from the
                        authorized GET /parcels/:id/damage-images endpoint. */}
                    <DamageImageManager requestId={request._id} canEdit={damageImagesEditable} />
                </div>
            )}
            {!isV2Request && isOwner && (
                <p className="text-sm opacity-70 mt-4">Damage photo upload is available for newer repair requests only.</p>
            )}

            {isV2Request && (
                <div className="card bg-base-200 p-6 mt-8">
                    <h3 className="text-2xl font-semibold mb-4">Technician Inspection</h3>
                    {/* Inspection data is fetched from the dedicated,
                        role-projected GET /parcels/:id/inspection endpoint (never
                        read off the raw parcel, which the server strips) - the
                        customer never receives internal technician notes or the
                        submitter's identity. */}
                    <InspectionSection requestId={request._id} canInspect={canInspect} isAssignedTechnicianView={isAssignedTechnicianView} />
                </div>
            )}

            {isV2Request && (
                <div className="card bg-base-200 p-6 mt-8">
                    <h3 className="text-2xl font-semibold mb-4">Repair Quote</h3>
                    {/* Quote data is fetched from the dedicated, role-projected
                        GET /parcels/:id/quote endpoint (never read off the raw
                        parcel, which the server strips). The server computes the
                        total and owns the currency; the customer approves or
                        declines but can never alter the line items. */}
                    <QuoteSection requestId={request._id} isOwner={isOwner} canSubmitQuote={canSubmitQuote} isAssignedTechnicianView={isAssignedTechnicianView} />
                </div>
            )}

            {/* V2 approved-quote payment (Phase 6.4 Unit 6). Owner-only and
                only for a non-cancelled v2 request; the section itself asks the
                server whether payment is eligible (GET /parcels/:id/payment-
                eligibility) and renders Pay Now only when the server says so -
                eligibility is never inferred from the quote status on the
                client. The amount comes from the server (the approved quote
                total, BDT); the client never sends an amount or currency. */}
            {isV2Request && isOwner && !isCancelled && (
                <V2PaymentSection requestId={request._id} />
            )}

            <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/track-request/${request.trackingId}`} className="btn btn-primary">
                    <FaHistory aria-hidden="true" /> View Timeline
                </Link>
                {/* V2 payment is not implemented yet - the server itself
                    already rejects it safely (services/paymentEligibility.js
                    returns PAYMENT_NOT_AVAILABLE for any v2 request, before
                    any Stripe call), but the button is hidden here too so a
                    customer never sees a "Pay Now" action that can only
                    ever fail. */}
                {isOwner && !isV2Request && request.paymentStatus !== 'paid' && !isCancelled && (
                    <Link to={`/dashboard/payment/${request._id}`} className="btn btn-primary">
                        <FaCreditCard aria-hidden="true" /> Pay Now
                    </Link>
                )}
                {isOwner && canCancelRequest(request) && (
                    <button
                        onClick={handleCancelRequest}
                        disabled={cancelling}
                        className="btn btn-outline btn-error">
                        <FaBan aria-hidden="true" /> {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                )}
                <Link to={backTo} className="btn btn-outline">
                    <FaArrowLeft aria-hidden="true" /> {backLabel}
                </Link>
            </div>
        </div>
    );
};

export default RequestDetails;
