import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoaderData, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import { createRepairRequestV2 } from '../../api/repairRequests';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct, findDefinitionById,
} from '../../utils/serviceDefinitionCatalog';
import {
    validateRepairRequestV2Form, buildRepairRequestV2Payload,
    DAMAGE_DESCRIPTION_MIN_LENGTH, DAMAGE_DESCRIPTION_MAX_LENGTH, BRAND_MODEL_MAX_LENGTH,
} from '../../utils/repairRequestV2Form';
import { getCreateRequestErrorMessage } from '../../utils/createRequestErrorMessage';
import ServiceDefinitionSelector from './ServiceDefinitionSelector';
import RepairRequestSummary from './RepairRequestSummary';
import PostCreationDamageStep from './PostCreationDamageStep';

const notBlank = (message) => (value) => (value && value.trim().length > 0) || message;

// Customer-facing V2 repair-request creation (Phase 6.4 Unit 3A) - the
// component now rendered at the single existing `/dashboard/create-request`
// route (see src/routes/router.jsx), which every marketing/dashboard entry
// point in the app already links to. State machine: `stage` ('form' |
// 'adding-images') plus `mutation.isPending` as the submitting substate
// (TanStack Query's own pending flag, not a duplicated boolean) and
// `ambiguousFailure` as a separate terminal display state for a malformed
// success response. "Complete" has no state of its own - it's simply
// navigating away (goToRequestDetails), which unmounts this component.
// Retrying after a normal (non-ambiguous) creation error never auto-
// resubmits - the customer stays on `stage === 'form'` and must press
// submit again.
const RepairRequestV2Form = () => {
    const {
        register, handleSubmit, control, setValue, formState: { errors },
    } = useForm();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const serviceAreas = useLoaderData();
    const regions = [...new Set(serviceAreas.map((c) => c.region))];
    const selectedRegion = useWatch({ control, name: 'serviceLocation.region' });
    const districtsByRegion = (region) => serviceAreas.filter((c) => c.region === region).map((d) => d.district);

    const { data: rawCatalogue, isLoading: catalogueLoading, isError: catalogueError, refetch: refetchCatalogue } = useServiceDefinitions();
    const definitions = normalizeServiceDefinitions(rawCatalogue);
    const productCategories = deriveProductCategories(definitions);
    const selectedProductCategorySlug = useWatch({ control, name: 'productCategorySlug' });
    const selectedServiceDefinitionId = useWatch({ control, name: 'serviceDefinitionId' });
    const servicesForSelectedProduct = getServicesForProduct(definitions, selectedProductCategorySlug);
    const selectedDefinition = findDefinitionById(definitions, selectedServiceDefinitionId);

    // Phase H #4: on product-category change, clear a now-stale service
    // selection rather than silently submitting a mismatched pair.
    const previousCategoryRef = useRef(selectedProductCategorySlug);
    useEffect(() => {
        if (previousCategoryRef.current !== undefined && previousCategoryRef.current !== selectedProductCategorySlug) {
            setValue('serviceDefinitionId', '');
        }
        previousCategoryRef.current = selectedProductCategorySlug;
    }, [selectedProductCategorySlug, setValue]);

    // Phase H: a selected service can go inactive (drop out of a background
    // refetch) after the customer already picked it - detected by it no
    // longer being present in a freshly-loaded, non-empty catalogue.
    const [staleServiceNotice, setStaleServiceNotice] = useState(false);
    useEffect(() => {
        if (catalogueLoading || definitions.length === 0) return;
        if (selectedServiceDefinitionId && !selectedDefinition) {
            setValue('serviceDefinitionId', '');
            setStaleServiceNotice(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawCatalogue]);

    const [stage, setStage] = useState('form'); // 'form' | 'adding-images'
    const [createdRequestId, setCreatedRequestId] = useState(null);
    const [ambiguousFailure, setAmbiguousFailure] = useState(false);
    const submittedValuesRef = useRef(null);

    const mutation = useMutation({
        mutationFn: (payload) => createRepairRequestV2(axiosSecure, payload),
        onSuccess: ({ requestId }) => {
            setCreatedRequestId(requestId);
            setStage('adding-images');
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
        },
        onError: (error) => {
            if (import.meta.env.DEV) console.error('V2 repair request creation failed:', error);
            // A malformed success response (2xx with no usable id) is
            // ambiguous, not a confirmed failure - the request may exist.
            // Never fabricate an id, never call any image endpoint, never
            // auto-resubmit.
            if (error?.isMalformedSuccessResponse) {
                setAmbiguousFailure(true);
                return;
            }
            Swal.fire({ icon: 'error', title: 'Could not create request', text: getCreateRequestErrorMessage(error) });
        },
    });

    const onSubmit = (values) => {
        // Single-flight guard beyond RHF's own re-entrancy: a mutation
        // already in flight or already succeeded never fires a second POST.
        if (mutation.isPending || stage !== 'form') return;

        const finalCheck = validateRepairRequestV2Form(values, definitions);
        if (!finalCheck.valid) {
            Swal.fire({ icon: 'error', title: 'Please check the form', text: 'Some details still need to be corrected.' });
            return;
        }

        submittedValuesRef.current = values;
        const payload = buildRepairRequestV2Payload(values);
        mutation.mutate(payload);
    };

    const goToRequestDetails = () => {
        if (createdRequestId) {
            navigate(`/dashboard/my-requests/${createdRequestId}`, { replace: true });
        } else {
            navigate('/dashboard/my-requests', { replace: true });
        }
    };

    if (ambiguousFailure) {
        return (
            <div>
                <h2 className="text-4xl font-bold">Create Repair Request</h2>
                <div className="alert alert-warning mt-8" role="alert">
                    <span>
                        We could not confirm whether your repair request was created. Please check your{' '}
                        <button type="button" className="link" onClick={() => navigate('/dashboard/my-requests')}>
                            My Repair Requests
                        </button>{' '}
                        list before submitting again.
                    </span>
                </div>
            </div>
        );
    }

    if (stage === 'adding-images' && createdRequestId) {
        const submitted = submittedValuesRef.current;
        const productCategoryLabel = productCategories.find((c) => c.slug === submitted?.productCategorySlug)?.label;
        return (
            <div>
                <h2 className="text-4xl font-bold">Repair Request Created</h2>
                <p className="opacity-70 mt-2">Your repair request has been created successfully.</p>
                {submitted && (
                    <div className="mt-6">
                        <RepairRequestSummary
                            productCategoryLabel={productCategoryLabel}
                            definition={selectedDefinition || findDefinitionById(definitions, submitted.serviceDefinitionId)}
                            damageDescription={submitted.damageDescription}
                            serviceLocation={submitted.serviceLocation}
                        />
                    </div>
                )}
                <div className="mt-6">
                    <PostCreationDamageStep
                        requestId={createdRequestId}
                        onContinue={goToRequestDetails}
                        onSkip={goToRequestDetails}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Create Repair Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 p-4 text-black">
                {staleServiceNotice && (
                    <div className="alert alert-warning mb-6" role="alert">
                        <span>The repair service you selected is no longer available. Please choose another.</span>
                    </div>
                )}

                <h4 className="text-2xl font-semibold mt-4">Product & Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 my-8">
                    <ServiceDefinitionSelector
                        register={register}
                        errors={errors}
                        isLoading={catalogueLoading}
                        isError={catalogueError}
                        onRetry={refetchCatalogue}
                        productCategories={productCategories}
                        servicesForSelectedProduct={servicesForSelectedProduct}
                        selectedProductCategorySlug={selectedProductCategorySlug}
                        selectedDefinition={selectedDefinition}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Device Details (optional)</h4>
                        <label className="label mt-2">Brand</label>
                        <input
                            type="text"
                            {...register('productBrand', {
                                validate: (value) => !value || value.trim().length <= BRAND_MODEL_MAX_LENGTH || `Brand must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`,
                            })}
                            className={`input w-full ${errors.productBrand ? 'input-error' : ''}`}
                            aria-invalid={errors.productBrand ? 'true' : 'false'}
                            placeholder="e.g. Samsung"
                        />
                        {errors.productBrand && <p role="alert" className="text-red-500 text-sm mt-1">{errors.productBrand.message}</p>}

                        <label className="label mt-4">Model</label>
                        <input
                            type="text"
                            {...register('productModel', {
                                validate: (value) => !value || value.trim().length <= BRAND_MODEL_MAX_LENGTH || `Model must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`,
                            })}
                            className={`input w-full ${errors.productModel ? 'input-error' : ''}`}
                            aria-invalid={errors.productModel ? 'true' : 'false'}
                            placeholder="e.g. Galaxy S21"
                        />
                        {errors.productModel && <p role="alert" className="text-red-500 text-sm mt-1">{errors.productModel.message}</p>}

                        <label className="label mt-4">Serial Number (optional)</label>
                        <input type="text" {...register('productSerialNumber')} className="input w-full" placeholder="Serial Number (optional)" />

                        <label className="label mt-4">Problem Description</label>
                        <textarea
                            {...register('damageDescription', {
                                required: 'Please describe the issue.',
                                validate: (value) => {
                                    const trimmed = (value || '').trim();
                                    if (trimmed.length < DAMAGE_DESCRIPTION_MIN_LENGTH || trimmed.length > DAMAGE_DESCRIPTION_MAX_LENGTH) {
                                        return `Please describe the issue in ${DAMAGE_DESCRIPTION_MIN_LENGTH}-${DAMAGE_DESCRIPTION_MAX_LENGTH} characters.`;
                                    }
                                    return true;
                                },
                            })}
                            className={`textarea w-full ${errors.damageDescription ? 'textarea-error' : ''}`}
                            aria-invalid={errors.damageDescription ? 'true' : 'false'}
                            placeholder="Describe the issue with your device"
                        />
                        {errors.damageDescription && <p role="alert" className="text-red-500 text-sm mt-1">{errors.damageDescription.message}</p>}
                    </fieldset>

                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Service Location</h4>
                        <label className="label mt-2">Region</label>
                        <select
                            {...register('serviceLocation.region', { validate: (v) => !!v || 'Please select a region.' })}
                            defaultValue=""
                            className={`select ${errors.serviceLocation?.region ? 'select-error' : ''}`}
                            aria-invalid={errors.serviceLocation?.region ? 'true' : 'false'}
                        >
                            <option value="" disabled>Pick a region</option>
                            {regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                        </select>
                        {errors.serviceLocation?.region && <p role="alert" className="text-red-500 text-sm mt-1">{errors.serviceLocation.region.message}</p>}

                        <label className="label mt-4">District</label>
                        <select
                            {...register('serviceLocation.district', { validate: (v) => !!v || 'Please select a district.' })}
                            defaultValue=""
                            className={`select ${errors.serviceLocation?.district ? 'select-error' : ''}`}
                            aria-invalid={errors.serviceLocation?.district ? 'true' : 'false'}
                        >
                            <option value="" disabled>Pick a district</option>
                            {districtsByRegion(selectedRegion).map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </select>
                        {errors.serviceLocation?.district && <p role="alert" className="text-red-500 text-sm mt-1">{errors.serviceLocation.district.message}</p>}

                        <label className="label mt-4">Service Address</label>
                        <input
                            type="text"
                            {...register('serviceLocation.address', {
                                required: 'Service address is required.',
                                validate: notBlank('Service address cannot be blank.'),
                            })}
                            className={`input w-full ${errors.serviceLocation?.address ? 'input-error' : ''}`}
                            aria-invalid={errors.serviceLocation?.address ? 'true' : 'false'}
                            placeholder="Where should the technician visit?"
                        />
                        {errors.serviceLocation?.address && <p role="alert" className="text-red-500 text-sm mt-1">{errors.serviceLocation.address.message}</p>}
                    </fieldset>
                </div>

                <button type="submit" disabled={mutation.isPending} className="btn btn-primary mt-8">
                    {mutation.isPending ? 'Creating Request...' : 'Create Repair Request'}
                </button>
                <p className="text-xs opacity-70 mt-2">No payment is required to submit a repair request.</p>
            </form>
        </div>
    );
};

export default RepairRequestV2Form;
