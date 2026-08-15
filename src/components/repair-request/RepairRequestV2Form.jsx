import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoaderData, useNavigate, useSearchParams, Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { CircleCheckBig, TriangleAlert, ArrowRight, ListChecks } from 'lucide-react';
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
import {
    deriveFlowProgress, buildReviewModel, getSuccessActions, WHAT_HAPPENS_NEXT,
} from '../../utils/createRequestFlow';
import { getCreateRequestErrorMessage } from '../../utils/createRequestErrorMessage';
import { notify } from '../../lib/notify';
import { PageHeader } from '../common/PageHeader';
import { FormField } from '../common/FormField';
import { LoadingButton } from '../common/LoadingButton';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { slideUp } from '../../theme/motion';
import ServiceDefinitionSelector from './ServiceDefinitionSelector';
import RepairRequestSummary from './RepairRequestSummary';
import PostCreationDamageStep from './PostCreationDamageStep';
import RequestFlowSteps from './RequestFlowSteps';

const SELECT_CLASS = 'flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 py-2 text-sm text-ds-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring focus-visible:ring-offset-1 focus-visible:ring-offset-ds-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-ds-destructive';

function SectionShell({ innerRef, step, title, description, children }) {
    return (
        <section ref={innerRef} className="scroll-mt-24 rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ds-primary/10 text-sm font-semibold text-ds-primary">{step}</span>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-ds-foreground">{title}</h2>
                    {description ? <p className="mt-0.5 text-sm text-ds-muted-foreground">{description}</p> : null}
                </div>
            </div>
            {children}
        </section>
    );
}

// Customer-facing V2 repair-request creation (Phase 6.4 Unit 3A, redesigned in
// Phase 7.7 into a guided single-page flow). Rendered at the single existing
// `/dashboard/create-request` route (see src/routes/router.jsx), which every
// marketing/dashboard entry point already links to.
//
// State machine (unchanged): `stage` ('form' | 'adding-images') plus
// `mutation.isPending` as the submitting substate (TanStack Query's own flag,
// not a duplicated boolean) and `ambiguousFailure` as a separate terminal
// display state for a malformed success response. "Complete" has no state of
// its own - it is navigation that unmounts this component. Retrying after a
// normal (non-ambiguous) creation error never auto-resubmits.
//
// BUSINESS FREEZE: this redesign changes presentation and local flow only. The
// POST payload (buildRepairRequestV2Payload), the create API, query keys, and
// the malformed-response handling are all preserved exactly.
const RepairRequestV2Form = () => {
    const {
        register, handleSubmit, control, setValue, reset, formState: { errors },
    } = useForm();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedCategorySlugRef = useRef(searchParams.get('category'));
    const categoryDeepLinkHandledRef = useRef(false);

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

    // Apply the initial public-service deep link once the canonical catalogue
    // is available. Exact slug matching rejects missing/stale values without
    // inventing a fallback, while the one-shot guard leaves later manual
    // category changes entirely under the customer's control.
    useEffect(() => {
        if (categoryDeepLinkHandledRef.current || productCategories.length === 0) return;

        categoryDeepLinkHandledRef.current = true;
        const requestedCategorySlug = requestedCategorySlugRef.current;
        if (requestedCategorySlug && productCategories.some((category) => category.slug === requestedCategorySlug)) {
            setValue('productCategorySlug', requestedCategorySlug);
        }
    }, [productCategories, setValue]);

    // Live section-completion snapshot for the stepper (presentation only).
    const watchedValues = useWatch({ control });
    const progress = deriveFlowProgress(watchedValues || {});

    // Phase H #4: on product-category change, clear a now-stale service
    // selection rather than silently submitting a mismatched pair.
    const previousCategoryRef = useRef(selectedProductCategorySlug);
    useEffect(() => {
        if (previousCategoryRef.current !== undefined && previousCategoryRef.current !== selectedProductCategorySlug) {
            setValue('serviceDefinitionId', '');
        }
        previousCategoryRef.current = selectedProductCategorySlug;
    }, [selectedProductCategorySlug, setValue]);

    // Same rationale as the category->service clear above: when the region
    // changes, a previously-picked district can no longer belong to it, so
    // clear it rather than carry a mismatched region/district pair forward.
    // Local UX correctness only - the district data source is unchanged.
    const previousRegionRef = useRef(selectedRegion);
    useEffect(() => {
        if (previousRegionRef.current !== undefined && previousRegionRef.current !== selectedRegion) {
            setValue('serviceLocation.district', '');
        }
        previousRegionRef.current = selectedRegion;
    }, [selectedRegion, setValue]);

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
    const [imageBusy, setImageBusy] = useState(false);
    const [activeStep, setActiveStep] = useState('device');
    const submittedValuesRef = useRef(null);

    const sectionRefs = {
        device: useRef(null),
        service: useRef(null),
        location: useRef(null),
        review: useRef(null),
    };
    const scrollToStep = (id) => {
        setActiveStep(id);
        sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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
            notify.error(getCreateRequestErrorMessage(error));
        },
    });

    const onSubmit = (values) => {
        // Single-flight guard beyond RHF's own re-entrancy: a mutation
        // already in flight or already succeeded never fires a second POST.
        if (mutation.isPending || stage !== 'form') return;

        const finalCheck = validateRepairRequestV2Form(values, definitions);
        if (!finalCheck.valid) {
            notify.error('Some details still need to be corrected before you can submit.');
            return;
        }

        submittedValuesRef.current = values;
        const payload = buildRepairRequestV2Payload(values);
        mutation.mutate(payload);
    };

    const goToRequestDetails = () => {
        if (imageBusy) {
            notify.info('Please wait for the current photo upload to finish (or cancel it) before continuing.');
            return;
        }
        const { viewRequest } = getSuccessActions(createdRequestId);
        navigate(viewRequest, { replace: true });
    };

    const goToMyRequests = () => {
        if (imageBusy) {
            notify.info('Please wait for the current photo upload to finish (or cancel it) before continuing.');
            return;
        }
        navigate('/dashboard/my-requests', { replace: true });
    };

    const handleCreateAnother = () => {
        if (imageBusy) {
            notify.info('Please wait for the current photo upload to finish (or cancel it) before continuing.');
            return;
        }
        // Reset the flow in place - a fresh form, never an auto-submit.
        reset();
        submittedValuesRef.current = null;
        setCreatedRequestId(null);
        setStage('form');
        setActiveStep('device');
        setStaleServiceNotice(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ---- Terminal: ambiguous (unconfirmed) creation ------------------------
    if (ambiguousFailure) {
        return (
            <div className="space-y-6">
                <PageHeader title="Request a Repair" />
                <div className="flex items-start gap-3 rounded-ds-lg border border-ds-warning/30 bg-ds-warning/10 p-4 text-sm text-ds-foreground" role="alert">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-warning" />
                    <p>
                        We could not confirm whether your repair request was created. Please check your{' '}
                        <Link to="/dashboard/my-requests" className="font-medium text-ds-primary underline underline-offset-2">My Requests</Link>{' '}
                        list before submitting again.
                    </p>
                </div>
            </div>
        );
    }

    // ---- Success: request created, optional photos + next actions ----------
    if (stage === 'adding-images' && createdRequestId) {
        const submitted = submittedValuesRef.current;
        const review = submitted ? buildReviewModel(submitted, definitions, productCategories) : null;
        return (
            <MotionConfig reducedMotion="user">
                <Motion.div variants={slideUp} initial="hidden" animate="show" className="space-y-6">
                    <div className="flex items-start gap-3 rounded-ds-lg border border-ds-success/30 bg-ds-success/10 p-4">
                        <CircleCheckBig aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-ds-success" />
                        <div>
                            <h1 className="text-lg font-semibold text-ds-foreground">Repair request created</h1>
                            <p className="text-sm text-ds-muted-foreground">Your request is in and waiting for review. You can add photos now or later.</p>
                        </div>
                    </div>

                    {review && <RepairRequestSummary review={review} />}

                    <PostCreationDamageStep requestId={createdRequestId} onBusyChange={setImageBusy} />

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button onClick={goToRequestDetails} className="w-full sm:w-auto">
                            View request <ArrowRight aria-hidden="true" />
                        </Button>
                        <Button variant="outline" onClick={goToMyRequests} className="w-full sm:w-auto">My requests</Button>
                        <Button variant="ghost" onClick={handleCreateAnother} className="w-full sm:w-auto">Create another request</Button>
                    </div>
                    {imageBusy && <p role="status" className="text-xs text-ds-muted-foreground">An upload is in progress - finish or cancel it before continuing.</p>}
                </Motion.div>
            </MotionConfig>
        );
    }

    // ---- Form --------------------------------------------------------------
    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader
                    title="Request a Repair"
                    description="Tell us about your device and the problem. It only takes a minute, and no payment is needed to submit."
                />

                <div className="flex items-start gap-3 rounded-ds-lg border border-ds-border bg-ds-muted/40 p-4">
                    <ListChecks aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-muted-foreground" />
                    <div className="min-w-0 text-sm">
                        <p className="font-medium text-ds-foreground">What happens after you submit</p>
                        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ds-muted-foreground">
                            {WHAT_HAPPENS_NEXT.map((line) => <li key={line}>{line}</li>)}
                        </ol>
                    </div>
                </div>

                <div className="sticky top-2 z-10">
                    <RequestFlowSteps progress={progress} activeStep={activeStep} onSelect={scrollToStep} />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                    <SectionShell innerRef={sectionRefs.device} step={1} title="Your device" description="Pick the type of device and add any details you have.">
                        <div className="space-y-6">
                            <ServiceDefinitionSelector
                                part="category"
                                register={register}
                                errors={errors}
                                isLoading={catalogueLoading}
                                isError={catalogueError}
                                onRetry={refetchCatalogue}
                                productCategories={productCategories}
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField id="productBrand" label="Brand" hint="Optional" error={errors.productBrand?.message}>
                                    <Input
                                        id="productBrand"
                                        placeholder="e.g. Samsung"
                                        aria-invalid={errors.productBrand ? 'true' : 'false'}
                                        {...register('productBrand', {
                                            validate: (value) => !value || value.trim().length <= BRAND_MODEL_MAX_LENGTH || `Brand must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`,
                                        })}
                                    />
                                </FormField>
                                <FormField id="productModel" label="Model" hint="Optional" error={errors.productModel?.message}>
                                    <Input
                                        id="productModel"
                                        placeholder="e.g. Galaxy S21"
                                        aria-invalid={errors.productModel ? 'true' : 'false'}
                                        {...register('productModel', {
                                            validate: (value) => !value || value.trim().length <= BRAND_MODEL_MAX_LENGTH || `Model must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`,
                                        })}
                                    />
                                </FormField>
                                <FormField id="productSerialNumber" label="Serial number" hint="Optional" className="sm:col-span-2">
                                    <Input id="productSerialNumber" placeholder="Serial number" {...register('productSerialNumber')} />
                                </FormField>
                            </div>
                        </div>
                    </SectionShell>

                    <SectionShell innerRef={sectionRefs.service} step={2} title="Repair needed" description="Choose a service and describe the problem.">
                        <div className="space-y-6">
                            {staleServiceNotice && (
                                <div className="flex items-start gap-2 rounded-ds border border-ds-warning/30 bg-ds-warning/10 p-3 text-sm text-ds-foreground" role="alert">
                                    <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-warning" />
                                    <span>The repair service you selected is no longer available. Please choose another.</span>
                                </div>
                            )}

                            <ServiceDefinitionSelector
                                part="service"
                                register={register}
                                errors={errors}
                                isLoading={catalogueLoading}
                                isError={catalogueError}
                                servicesForSelectedProduct={servicesForSelectedProduct}
                                selectedProductCategorySlug={selectedProductCategorySlug}
                                selectedDefinition={selectedDefinition}
                            />

                            <FormField
                                id="damageDescription"
                                label="Describe the issue"
                                required
                                error={errors.damageDescription?.message}
                                hint={`Please describe the problem in ${DAMAGE_DESCRIPTION_MIN_LENGTH}-${DAMAGE_DESCRIPTION_MAX_LENGTH} characters.`}
                            >
                                <Textarea
                                    id="damageDescription"
                                    rows={4}
                                    placeholder="What is wrong with your device? When did it start?"
                                    aria-invalid={errors.damageDescription ? 'true' : 'false'}
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
                                />
                            </FormField>
                        </div>
                    </SectionShell>

                    <SectionShell innerRef={sectionRefs.location} step={3} title="Service location" description="Where should the technician collect the device?">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField id="region" label="Region" required error={errors.serviceLocation?.region?.message}>
                                <select
                                    id="region"
                                    defaultValue=""
                                    className={SELECT_CLASS}
                                    aria-invalid={errors.serviceLocation?.region ? 'true' : 'false'}
                                    {...register('serviceLocation.region', { validate: (v) => !!v || 'Please select a region.' })}
                                >
                                    <option value="" disabled>Pick a region</option>
                                    {regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                </select>
                            </FormField>

                            <FormField id="district" label="District" required error={errors.serviceLocation?.district?.message}>
                                <select
                                    id="district"
                                    defaultValue=""
                                    className={SELECT_CLASS}
                                    aria-invalid={errors.serviceLocation?.district ? 'true' : 'false'}
                                    {...register('serviceLocation.district', { validate: (v) => !!v || 'Please select a district.' })}
                                >
                                    <option value="" disabled>Pick a district</option>
                                    {districtsByRegion(selectedRegion).map((d, i) => <option key={i} value={d}>{d}</option>)}
                                </select>
                            </FormField>

                            <FormField id="address" label="Service address" required error={errors.serviceLocation?.address?.message} className="sm:col-span-2">
                                <Input
                                    id="address"
                                    placeholder="Where should the technician visit?"
                                    aria-invalid={errors.serviceLocation?.address ? 'true' : 'false'}
                                    {...register('serviceLocation.address', {
                                        required: 'Service address is required.',
                                        validate: (value) => (value && value.trim().length > 0) || 'Service address cannot be blank.',
                                    })}
                                />
                            </FormField>
                        </div>
                    </SectionShell>

                    <SectionShell innerRef={sectionRefs.review} step={4} title="Review & submit" description="Check the details, then submit your request.">
                        <div className="space-y-5">
                            {progress.review ? (
                                <RepairRequestSummary review={buildReviewModel(watchedValues || {}, definitions, productCategories)} />
                            ) : (
                                <p className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-sm text-ds-muted-foreground">
                                    Complete the sections above to see your request summary here.
                                </p>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <LoadingButton type="submit" loading={mutation.isPending} loadingText="Creating request..." className="w-full sm:w-auto">
                                    Create repair request
                                </LoadingButton>
                                <Link to="/dashboard/my-requests" className={`${buttonVariants({ variant: 'ghost' })} w-full sm:w-auto`}>Cancel</Link>
                            </div>
                            <p className="text-xs text-ds-muted-foreground">No payment is required to submit a repair request.</p>
                        </div>
                    </SectionShell>
                </form>
            </div>
        </MotionConfig>
    );
};

export default RepairRequestV2Form;
