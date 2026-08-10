import React, { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct, humanizeSlug,
} from '../../utils/serviceDefinitionCatalog';
import {
    buildTechnicianApplicationPayload, validateExpertiseSelections, deriveLevelForYears, MAX_EXPERIENCE_YEARS,
} from '../../utils/technicianExpertiseForm';
import { getTechnicianApplicationErrorMessage } from '../../utils/technicianApplicationErrorMessage';
import { notify } from '../../lib/notify';

const notBlank = message => value => (value && value.trim().length > 0) || message;

// Phase 8.7A: the application now collects the canonical matching profile the
// eligible-technician matcher requires - service area (region/district) plus a
// structured expertise selection (canonical product + repair categories +
// years, from which the skill level is derived) - so an approved applicant is
// matchable without any manual database edit. The applicant never submits
// workStatus or any operational field; the payload is assembled explicitly.
const BecomeTechnician = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm();
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const [submitting, setSubmitting] = useState(false);

    const serviceAreas = useLoaderData();
    const regions = useMemo(() => [...new Set(serviceAreas.map(c => c.region))], [serviceAreas]);
    const districtsByRegion = (region) => serviceAreas.filter(c => c.region === region).map(d => d.district);
    const technicianRegion = useWatch({ control, name: 'region' });

    // Canonical expertise catalogue (public service definitions).
    const { data: rawDefinitions, isLoading: definitionsLoading, isError: definitionsError } = useServiceDefinitions();
    const definitions = useMemo(() => normalizeServiceDefinitions(rawDefinitions), [rawDefinitions]);
    const productCategories = useMemo(() => deriveProductCategories(definitions), [definitions]);

    // Expertise builder state: { [productSlug]: { repairSlugs: string[], experienceYears: string } }.
    const [expertise, setExpertise] = useState({});
    const [expertiseError, setExpertiseError] = useState(null);

    const toggleProduct = (slug) => {
        setExpertise((prev) => {
            const next = { ...prev };
            if (next[slug]) delete next[slug];
            else next[slug] = { repairSlugs: [], experienceYears: '' };
            return next;
        });
    };
    const toggleRepair = (productSlug, repairSlug) => {
        setExpertise((prev) => {
            const current = prev[productSlug] || { repairSlugs: [], experienceYears: '' };
            const has = current.repairSlugs.includes(repairSlug);
            const repairSlugs = has ? current.repairSlugs.filter((s) => s !== repairSlug) : [...current.repairSlugs, repairSlug];
            return { ...prev, [productSlug]: { ...current, repairSlugs } };
        });
    };
    const setYears = (productSlug, value) => {
        setExpertise((prev) => {
            const current = prev[productSlug] || { repairSlugs: [], experienceYears: '' };
            return { ...prev, [productSlug]: { ...current, experienceYears: value } };
        });
    };

    const handleTechnicianApplication = (data) => {
        if (submitting) return;

        const expertiseCheck = validateExpertiseSelections(expertise);
        if (!expertiseCheck.valid) {
            setExpertiseError(expertiseCheck.message);
            return;
        }
        setExpertiseError(null);
        setSubmitting(true);

        const payload = buildTechnicianApplicationPayload(data, expertise);
        axiosSecure.post('/riders', payload)
            .then(res => {
                if (res.data.insertedId) {
                    notify.success('Your application has been submitted. We will reach out to you in 1–5 days.');
                }
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('Technician application submission failed:', error);
                notify.error(getTechnicianApplicationErrorMessage(error));
            })
            .finally(() => setSubmitting(false));
    };

    const inputClass = (hasError) => `input w-full ${hasError ? 'input-error' : ''}`;

    return (
        <div className="text-ds-foreground">
            <h2 className="text-4xl font-bold">Become a Technician</h2>
            <p className="mt-2 text-ds-muted-foreground">Tell us where you work and what you can repair so we can match you to the right jobs.</p>
            <form onSubmit={handleSubmit(handleTechnicianApplication)} noValidate className='mt-8'>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>

                    {/* ---- Profile / service area ---- */}
                    <fieldset className="space-y-3">
                        <h4 className="text-2xl font-semibold">Your Details</h4>

                        <div>
                            <label htmlFor="tech-name" className="label">Technician Name</label>
                            <input id="tech-name" type="text"
                                {...register('name', { required: 'Name is required.', validate: notBlank('Name cannot be blank.') })}
                                defaultValue={user?.displayName}
                                className={inputClass(errors.name)} aria-invalid={errors.name ? 'true' : 'false'} placeholder="Your Name" />
                            {errors.name && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="tech-email" className="label">Email</label>
                            <input id="tech-email" type="text"
                                {...register('email', { required: 'Email is required.', validate: notBlank('Email cannot be blank.') })}
                                defaultValue={user?.email}
                                className={inputClass(errors.email)} aria-invalid={errors.email ? 'true' : 'false'} placeholder="Your Email" />
                            {errors.email && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="tech-region" className="label">Region</label>
                            <select id="tech-region"
                                {...register('region', { validate: value => (value && value !== 'Pick a region') || 'Please select a region.' })}
                                defaultValue="Pick a region"
                                className={`select w-full ${errors.region ? 'select-error' : ''}`} aria-invalid={errors.region ? 'true' : 'false'}>
                                <option disabled={true}>Pick a region</option>
                                {regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                            </select>
                            {errors.region && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.region.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="tech-district" className="label">District</label>
                            <select id="tech-district"
                                {...register('district', { validate: value => (value && value !== 'Pick a district') || 'Please select a district.' })}
                                defaultValue="Pick a district"
                                className={`select w-full ${errors.district ? 'select-error' : ''}`} aria-invalid={errors.district ? 'true' : 'false'}>
                                <option disabled={true}>Pick a district</option>
                                {districtsByRegion(technicianRegion).map((r, i) => <option key={i} value={r}>{r}</option>)}
                            </select>
                            {errors.district && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.district.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="tech-address" className="label">Your Service Address</label>
                            <input id="tech-address" type="text"
                                {...register('address', { required: 'Address is required.', validate: notBlank('Address cannot be blank.') })}
                                className={inputClass(errors.address)} aria-invalid={errors.address ? 'true' : 'false'} placeholder="Your Address" />
                            {errors.address && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.address.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="tech-nid" className="label">National ID (NID)</label>
                            <input id="tech-nid" type="text"
                                {...register('nid', { required: 'National ID is required.', validate: notBlank('National ID cannot be blank.') })}
                                className={inputClass(errors.nid)} aria-invalid={errors.nid ? 'true' : 'false'} placeholder="NID" />
                            {errors.nid && <p role="alert" className="mt-1 text-sm text-ds-destructive">{errors.nid.message}</p>}
                        </div>
                    </fieldset>

                    {/* ---- Expertise builder ---- */}
                    <fieldset className="space-y-3">
                        <h4 className="text-2xl font-semibold">Your Expertise</h4>
                        <p className="text-sm text-ds-muted-foreground">Pick the products you repair, the specific repairs you handle, and your years of experience. We use these to match you to jobs.</p>

                        {definitionsLoading && <p className="text-sm text-ds-muted-foreground">Loading repair categories…</p>}
                        {definitionsError && <p role="alert" className="text-sm text-ds-destructive">Couldn't load repair categories. Please refresh and try again.</p>}

                        {!definitionsLoading && !definitionsError && productCategories.length === 0 && (
                            <p className="text-sm text-ds-muted-foreground">No repair categories are available right now.</p>
                        )}

                        <div className="space-y-3">
                            {productCategories.map((product) => {
                                const selected = !!expertise[product.slug];
                                const state = expertise[product.slug] || { repairSlugs: [], experienceYears: '' };
                                const services = getServicesForProduct(definitions, product.slug);
                                const level = deriveLevelForYears(state.experienceYears);
                                return (
                                    <div key={product.slug} className="rounded-ds-lg border border-ds-border bg-ds-card p-3">
                                        <label className="flex items-center gap-2 font-medium">
                                            <input type="checkbox" className="checkbox checkbox-sm" checked={selected} onChange={() => toggleProduct(product.slug)} />
                                            {product.label}
                                        </label>

                                        {selected && (
                                            <div className="mt-3 space-y-3 pl-6">
                                                <div>
                                                    <p className="text-sm font-medium">Repairs you handle</p>
                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                        {services.map((svc) => (
                                                            <label key={svc.repairCategorySlug} className="flex items-center gap-2 text-sm">
                                                                <input type="checkbox" className="checkbox checkbox-xs"
                                                                    checked={state.repairSlugs.includes(svc.repairCategorySlug)}
                                                                    onChange={() => toggleRepair(product.slug, svc.repairCategorySlug)} />
                                                                {humanizeSlug(svc.repairCategorySlug)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label htmlFor={`years-${product.slug}`} className="text-sm">Years of experience</label>
                                                    <input id={`years-${product.slug}`} type="number" min="0" max={MAX_EXPERIENCE_YEARS} inputMode="numeric"
                                                        value={state.experienceYears}
                                                        onChange={(e) => setYears(product.slug, e.target.value)}
                                                        className="input input-sm w-24" placeholder="0" />
                                                    {level && <span className="text-xs text-ds-muted-foreground">Level: {humanizeSlug(level)}</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {expertiseError && <p role="alert" className="text-sm text-ds-destructive">{expertiseError}</p>}
                    </fieldset>
                </div>

                <input type="submit" disabled={submitting}
                    className='btn btn-primary mt-8'
                    value={submitting ? 'Submitting Application...' : 'Apply as a Technician'} />
            </form>
        </div>
    );
};

export default BecomeTechnician;
