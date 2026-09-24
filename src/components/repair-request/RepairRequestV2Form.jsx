import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoaderData, useNavigate, useSearchParams, Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { CircleCheckBig, TriangleAlert, ArrowRight } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import { serviceDefinitionKeys } from '../../hooks/serviceDefinitionKeys';
import { createRepairRequestV2 } from '../../api/repairRequests';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct, findDefinitionById,
} from '../../utils/serviceDefinitionCatalog';
import {
    validateRepairRequestV2Form, buildRepairRequestV2Payload,
    DAMAGE_DESCRIPTION_MIN_LENGTH, DAMAGE_DESCRIPTION_MAX_LENGTH, BRAND_MODEL_MAX_LENGTH,
} from '../../utils/repairRequestV2Form';
import { buildReviewModel, getSuccessActions } from '../../utils/createRequestFlow';
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
import { MobileActionBar } from '../layout/MobileActionBar';
import { FormAlert } from '../common/FormAlert';
import { Card } from '../ui/card';
import { Select } from '../ui/select';
import { PickupSlotPicker } from '../pickup/PickupSlotPicker';
import { pickupSlotKeys } from '../../hooks/usePickupSlots';
import { formatPickupChoice, STALE_PICKUP_CODES } from '../../utils/pickupSlots';


// One numbered part of the form: a numbered heading and the fields beneath.
function SectionShell({ step, stepId, title, description, children }) {
    const headingId = `request-${stepId}-heading`;
    return (
        <section aria-labelledby={headingId} className="rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ds-ink text-body-sm font-extrabold text-ds-ink-foreground">
                    {step}
                </span>
                <div className="min-w-0 pt-0.5">
                    <h2 id={headingId} className="text-heading text-ds-foreground">{title}</h2>
                    {description ? <p className="mt-0.5 text-body-sm text-ds-muted-foreground">{description}</p> : null}
                </div>
            </div>
            {children}
        </section>
    );
}

// Counts the fields react-hook-form flagged, for the error summary.
function countFieldErrors(errors) {
    if (!errors || typeof errors !== 'object') return 0;
    if (typeof errors.message === 'string') return 1;
    return Object.values(errors).reduce((total, value) => total + countFieldErrors(value), 0);
}

// The request so far, beside the form on desktop: each choice as it is made,
// the estimate, and the one submit button.
function SummaryRow({ label, value }) {
    return (
        <div className="py-2.5">
            <dt className="text-micro font-semibold text-ds-muted-foreground">{label}</dt>
            <dd className={value ? 'mt-0.5 break-words text-body-sm font-semibold text-ds-foreground' : 'mt-0.5 text-body-sm text-ds-muted-foreground'}>{value || 'Not chosen yet'}</dd>
        </div>
    );
}

// Customer-facing V2 repair-request creation, presented as a guided single-page
// flow. Rendered at the single existing
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
        register, handleSubmit, control, setValue, setError, reset, formState: { errors },
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

    const {
        data: rawCatalogue,
        isPending: cataloguePending,
        isPaused: cataloguePaused,
        isError: catalogueError,
    } = useServiceDefinitions();
    const definitions = normalizeServiceDefinitions(rawCatalogue);
    const productCategories = deriveProductCategories(definitions);
    const catalogueLoading = cataloguePending && !cataloguePaused;
    const catalogueUnavailable = catalogueError || cataloguePaused;
    const retryCatalogue = () => queryClient.resetQueries({ queryKey: serviceDefinitionKeys.list() });
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

    // Live values for the summary card (presentation only).
    const watchedValues = useWatch({ control });
    const descriptionLength = (watchedValues?.damageDescription || '').length;
    const liveReview = buildReviewModel(watchedValues || {}, definitions, productCategories);
    const selectedServiceArea = [
        watchedValues?.serviceLocation?.district,
        watchedValues?.serviceLocation?.region,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).join(', ');

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
            // Pickup times are per region, so a chosen time no longer applies.
            setValue('pickupChoice', '');
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
    const submittedValuesRef = useRef(null);
    // Shown at the top of the form after a failed submit: a count of fields to
    // fix (react-hook-form also moves focus to the first one), or -1 when the
    // final catalogue re-check failed.
    const [submitProblem, setSubmitProblem] = useState(0);

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
            // The chosen time was taken or closed meanwhile: reload the times
            // and ask for another, keeping everything else the customer typed.
            if (STALE_PICKUP_CODES.includes(error?.response?.data?.code)) {
                queryClient.invalidateQueries({ queryKey: pickupSlotKeys.all });
                setValue('pickupChoice', '');
                setError('pickupChoice', { message: 'That time is no longer available. Please choose another.' }, { shouldFocus: false });
                document.getElementById('request-pickup-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            setSubmitProblem(-1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSubmitProblem(0);

        submittedValuesRef.current = values;
        const payload = buildRepairRequestV2Payload(values);
        mutation.mutate(payload);
    };

    const onInvalid = (formErrors) => setSubmitProblem(countFieldErrors(formErrors));

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
        setSubmitProblem(0);
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
                    <div className="flex items-start gap-3 rounded-ds-lg bg-ds-success-subtle p-5">
                        <CircleCheckBig aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-ds-success" />
                        <div>
                            <h1 id="page-title" tabIndex={-1} className="text-title text-ds-foreground outline-none">Request created</h1>
                            <p className="mt-1 text-body-sm text-ds-muted-foreground">We will assign an approved technician. Photos help them prepare, so add some now or later.</p>
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
    const estimateText = liveReview.estimateText;
    const submitButton = (fullWidth) => (
        <LoadingButton
            type="submit"
            form="repair-request-form"
            variant="action"
            size="lg"
            loading={mutation.isPending}
            loadingText="Creating…"
            className={fullWidth ? 'w-full' : 'shrink-0'}
        >
            Create request
        </LoadingButton>
    );

    return (
        <MotionConfig reducedMotion="user">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-24 lg:pb-0">
                <PageHeader
                    title="Request a repair"
                    description="Four short steps. No payment is needed to submit."
                />

                {submitProblem !== 0 && (
                    <FormAlert
                        alert={submitProblem === -1
                            ? { tone: 'danger', title: 'Some details need another look', text: 'A choice may no longer be available. Check the device and service, then try again.' }
                            : { tone: 'danger', title: `Check ${submitProblem} field${submitProblem === 1 ? '' : 's'}`, text: 'Fix the highlighted fields, then create your request.' }}
                    />
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <form id="repair-request-form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="min-w-0 space-y-5">
                        <SectionShell step={1} stepId="device" title="Your device" description="Choose the device, then add the brand and model if you know them.">
                                <div className="space-y-6">
                                    <ServiceDefinitionSelector
                                        part="category"
                                        register={register}
                                        errors={errors}
                                        isLoading={catalogueLoading}
                                        isError={catalogueUnavailable}
                                        onRetry={retryCatalogue}
                                        productCategories={productCategories}
                                    />

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormField id="productBrand" label="Brand" hint="Optional" error={errors.productBrand?.message}>
                                            <Input
                                                id="productBrand"
                                                placeholder="e.g. Samsung"
                                                aria-invalid={errors.productBrand ? 'true' : 'false'}
                                                aria-describedby={errors.productBrand ? 'productBrand-error' : 'productBrand-hint'}
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
                                                aria-describedby={errors.productModel ? 'productModel-error' : 'productModel-hint'}
                                                {...register('productModel', {
                                                    validate: (value) => !value || value.trim().length <= BRAND_MODEL_MAX_LENGTH || `Model must be ${BRAND_MODEL_MAX_LENGTH} characters or fewer.`,
                                                })}
                                            />
                                        </FormField>
                                        <FormField id="productSerialNumber" label="Serial number" hint="Optional" className="sm:col-span-2">
                                            <Input
                                                id="productSerialNumber"
                                                placeholder="Serial number"
                                                aria-describedby="productSerialNumber-hint"
                                                {...register('productSerialNumber')}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                        </SectionShell>

                        <SectionShell step={2} stepId="service" title="What is wrong" description="Pick the repair and describe the problem.">
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
                                        isError={catalogueUnavailable}
                                        servicesForSelectedProduct={servicesForSelectedProduct}
                                        selectedProductCategorySlug={selectedProductCategorySlug}
                                        selectedDefinition={selectedDefinition}
                                    />

                                    <FormField
                                        id="damageDescription"
                                        label="Describe the issue"
                                        required
                                        error={errors.damageDescription?.message}
                                        hint={`${descriptionLength} / ${DAMAGE_DESCRIPTION_MAX_LENGTH} characters, at least ${DAMAGE_DESCRIPTION_MIN_LENGTH}`}
                                    >
                                        <Textarea
                                            id="damageDescription"
                                            rows={5}
                                            required
                                            aria-required="true"
                                            placeholder="What is wrong with your device? When did it start?"
                                            aria-invalid={errors.damageDescription ? 'true' : 'false'}
                                            aria-describedby={errors.damageDescription ? 'damageDescription-error' : 'damageDescription-hint'}
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

                        <SectionShell step={3} stepId="location" title="Where to collect it" description="Your technician collects the device from this address.">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField id="region" label="Region" required error={errors.serviceLocation?.region?.message}>
                                        <Select
                                            id="region"
                                            defaultValue=""
                                            aria-invalid={errors.serviceLocation?.region ? 'true' : 'false'}
                                            aria-required="true"
                                            aria-describedby={errors.serviceLocation?.region ? 'region-error' : undefined}
                                            {...register('serviceLocation.region', { validate: (v) => !!v || 'Please select a region.' })}
                                        >
                                            <option value="" disabled>Pick a region</option>
                                            {regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                        </Select>
                                    </FormField>

                                    <FormField id="district" label="District" required error={errors.serviceLocation?.district?.message}>
                                        <Select
                                            id="district"
                                            defaultValue=""
                                            disabled={!selectedRegion}
                                            aria-invalid={errors.serviceLocation?.district ? 'true' : 'false'}
                                            aria-required="true"
                                            aria-describedby={errors.serviceLocation?.district ? 'district-error' : undefined}
                                            {...register('serviceLocation.district', { validate: (v) => !!v || 'Please select a district.' })}
                                        >
                                            <option value="" disabled>{selectedRegion ? 'Pick a district' : 'Pick a region first'}</option>
                                            {districtsByRegion(selectedRegion).map((d, i) => <option key={i} value={d}>{d}</option>)}
                                        </Select>
                                    </FormField>

                                    <FormField id="address" label="Service address" required error={errors.serviceLocation?.address?.message} className="sm:col-span-2">
                                        <Input
                                            id="address"
                                            required
                                            aria-required="true"
                                            placeholder="Where should the technician visit?"
                                            aria-invalid={errors.serviceLocation?.address ? 'true' : 'false'}
                                            aria-describedby={errors.serviceLocation?.address ? 'address-error' : undefined}
                                            {...register('serviceLocation.address', {
                                                required: 'Service address is required.',
                                                validate: (value) => (value && value.trim().length > 0) || 'Service address cannot be blank.',
                                            })}
                                        />
                                    </FormField>
                                </div>
                        </SectionShell>

                        <SectionShell step={4} stepId="pickup" title="When to collect it" description="Choose a 2-hour pickup window. You can change it until the device is collected.">
                            <Controller
                                name="pickupChoice"
                                control={control}
                                defaultValue=""
                                rules={{ validate: (v) => !!v || 'Please choose a pickup time.' }}
                                render={({ field }) => (
                                    <PickupSlotPicker
                                        region={selectedRegion}
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.pickupChoice?.message}
                                        errorId="pickup-error"
                                    />
                                )}
                            />
                        </SectionShell>

                        <div className="lg:hidden">
                            <Link to="/dashboard/my-requests" className={buttonVariants({ variant: 'ghost' })}>Cancel</Link>
                        </div>
                    </form>

                    <aside aria-labelledby="request-summary-heading" className="hidden lg:sticky lg:top-24 lg:block">
                        <Card className="p-5">
                            <h2 id="request-summary-heading" className="text-subhead text-ds-foreground">Your request</h2>
                            <dl className="mt-2 divide-y divide-ds-border">
                                <SummaryRow label="Device" value={[liveReview.productCategoryLabel, liveReview.deviceLabel].filter(Boolean).join(' · ')} />
                                <SummaryRow label="Repair" value={liveReview.serviceLabel} />
                                <SummaryRow label="Location" value={selectedServiceArea} />
                                <SummaryRow label="Pickup" value={formatPickupChoice(watchedValues?.pickupChoice)} />
                                <SummaryRow label="Estimate" value={estimateText} />
                            </dl>
                            <div className="mt-4 space-y-2">
                                {submitButton(true)}
                                <Link to="/dashboard/my-requests" className={`${buttonVariants({ variant: 'ghost' })} w-full`}>Cancel</Link>
                            </div>
                            <p className="mt-3 text-micro text-ds-muted-foreground">No payment is needed to submit.</p>
                        </Card>
                    </aside>
                </div>
            </div>

            <MobileActionBar>
                <div className="min-w-0 flex-1">
                    <p className="text-micro font-semibold text-ds-muted-foreground">{estimateText ? 'Estimated' : 'No payment to submit'}</p>
                    <p className="ds-numeric truncate text-body-sm font-bold text-ds-foreground">{estimateText || 'Free to request'}</p>
                </div>
                {submitButton(false)}
            </MobileActionBar>
        </MotionConfig>
    );
};

export default RepairRequestV2Form;
