import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import { ClipboardCheck, IdCard, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import {
    buildTechnicianApplicationPayload, validateExpertiseSelections, MAX_EXPERIENCE_YEARS,
} from '../../utils/technicianExpertiseForm';
import { ExpertisePicker } from '../../components/technician/ExpertisePicker';
import { useExpertiseSelections } from '../../hooks/useExpertiseSelections';
import { getTechnicianApplicationErrorMessage } from '../../utils/technicianApplicationErrorMessage';
import { notify } from '../../lib/notify';
import { FormField } from '../../components/common/FormField';
import { LoadingButton } from '../../components/common/LoadingButton';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

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

    // Expertise builder state and the picker itself are shared with the
    // technician's profile editor (components/technician/ExpertisePicker).
    const {
        selections: expertise, toggleProduct, toggleRepair, setYears,
    } = useExpertiseSelections();
    const [expertiseError, setExpertiseError] = useState(null);

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
        axiosSecure.post('/technicians', payload)
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

    return (
        <div className="px-4 pb-16 pt-12 text-ds-foreground sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
            <div className="mx-auto max-w-6xl">
                <header className="max-w-3xl">
                    <p className="ds-label text-ds-primary">Technician application</p>
                    <h1 className="mt-4 text-title text-ds-foreground sm:text-4xl">Apply to provide repair services through Sarabo.</h1>
                    <p className="mt-4 max-w-2xl text-body text-ds-muted-foreground">
                        Tell us about your service area and the repairs you handle. Your application will be submitted for administrator review.
                    </p>
                </header>

                <div className="mt-10 grid items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
                    <aside className="rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6 lg:sticky lg:top-24" aria-labelledby="application-requirements-title">
                        <p className="ds-label text-ds-muted-foreground">Before you apply</p>
                        <h2 id="application-requirements-title" className="mt-3 text-heading text-ds-foreground">Have these details ready.</h2>
                        <p className="mt-2 text-body-sm text-ds-muted-foreground">
                            Complete the application in one submission. Fields marked with an asterisk are required.
                        </p>

                        <ul className="mt-6 divide-y divide-ds-border">
                            <li className="flex gap-3 py-4 first:pt-0">
                                <ClipboardCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                                <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-ds-foreground">Account details</p>
                                    <p className="mt-1 text-micro text-ds-muted-foreground">Your signed-in name and email are prefilled.</p>
                                </div>
                            </li>
                            <li className="flex gap-3 py-4">
                                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                                <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-ds-foreground">Service area</p>
                                    <p className="mt-1 text-micro text-ds-muted-foreground">Choose your region and district, then provide your service address.</p>
                                </div>
                            </li>
                            <li className="flex gap-3 py-4">
                                <Wrench aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                                <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-ds-foreground">Repair expertise</p>
                                    <p className="mt-1 text-micro text-ds-muted-foreground">Select the products, repair categories, and experience that apply to you.</p>
                                </div>
                            </li>
                            <li className="flex gap-3 py-4 last:pb-0">
                                <IdCard aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                                <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-ds-foreground">Identity information</p>
                                    <p className="mt-1 text-micro text-ds-muted-foreground">Your National ID is included in the application for administrator review.</p>
                                </div>
                            </li>
                        </ul>

                        <div className="mt-6 border-t border-ds-border pt-5">
                            <div className="flex gap-3">
                                <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-primary" />
                                <p className="text-body-sm text-ds-muted-foreground">
                                    Submitted applications remain pending until an administrator reviews them.
                                </p>
                            </div>
                        </div>
                    </aside>

                    <form onSubmit={handleSubmit(handleTechnicianApplication)} noValidate className="min-w-0 space-y-6">
                        <section className="rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6" aria-labelledby="applicant-details-title">
                            <div className="border-b border-ds-border pb-4">
                                <p className="ds-label text-ds-muted-foreground">Application details</p>
                                <h2 id="applicant-details-title" className="mt-2 text-heading text-ds-foreground">Personal information</h2>
                                <p className="mt-1 text-body-sm text-ds-muted-foreground">Confirm the contact details prefilled from your account.</p>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <FormField id="tech-name" label="Technician name" required error={errors.name?.message}>
                                    <Input
                                        id="tech-name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        {...register('name', { required: 'Name is required.', validate: notBlank('Name cannot be blank.') })}
                                        defaultValue={user?.displayName}
                                        aria-invalid={errors.name ? 'true' : 'false'}
                                        aria-describedby={errors.name ? 'tech-name-error' : undefined}
                                        placeholder="Your name"
                                    />
                                </FormField>

                                <FormField id="tech-email" label="Email" required error={errors.email?.message}>
                                    <Input
                                        id="tech-email"
                                        type="text"
                                        autoComplete="email"
                                        required
                                        {...register('email', { required: 'Email is required.', validate: notBlank('Email cannot be blank.') })}
                                        defaultValue={user?.email}
                                        aria-invalid={errors.email ? 'true' : 'false'}
                                        aria-describedby={errors.email ? 'tech-email-error' : undefined}
                                        placeholder="Your email"
                                    />
                                </FormField>
                            </div>
                        </section>

                        <section className="rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6" aria-labelledby="service-area-title">
                            <div className="border-b border-ds-border pb-4">
                                <p className="ds-label text-ds-muted-foreground">Where you work</p>
                                <h2 id="service-area-title" className="mt-2 text-heading text-ds-foreground">Service area and identity</h2>
                                <p className="mt-1 text-body-sm text-ds-muted-foreground">Provide the location and identity details included with your application.</p>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <FormField id="tech-region" label="Region" required error={errors.region?.message}>
                                    <Select
                                        id="tech-region"
                                        {...register('region', { validate: value => (value && value !== 'Pick a region') || 'Please select a region.' })}
                                        defaultValue="Pick a region"
                                        required
                                        aria-invalid={errors.region ? 'true' : 'false'}
                                        aria-describedby={errors.region ? 'tech-region-error' : undefined}
                                    >
                                        <option disabled={true}>Pick a region</option>
                                        {regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                    </Select>
                                </FormField>

                                <FormField id="tech-district" label="District" required error={errors.district?.message}>
                                    <Select
                                        id="tech-district"
                                        {...register('district', { validate: value => (value && value !== 'Pick a district') || 'Please select a district.' })}
                                        defaultValue="Pick a district"
                                        required
                                        aria-invalid={errors.district ? 'true' : 'false'}
                                        aria-describedby={errors.district ? 'tech-district-error' : undefined}
                                    >
                                        <option disabled={true}>Pick a district</option>
                                        {districtsByRegion(technicianRegion).map((r, i) => <option key={i} value={r}>{r}</option>)}
                                    </Select>
                                </FormField>

                                <FormField id="tech-address" label="Service address" required error={errors.address?.message} className="sm:col-span-2">
                                    <Input
                                        id="tech-address"
                                        type="text"
                                        autoComplete="street-address"
                                        required
                                        {...register('address', { required: 'Address is required.', validate: notBlank('Address cannot be blank.') })}
                                        aria-invalid={errors.address ? 'true' : 'false'}
                                        aria-describedby={errors.address ? 'tech-address-error' : undefined}
                                        placeholder="Your service address"
                                    />
                                </FormField>

                                <FormField
                                    id="tech-nid"
                                    label="National ID (NID)"
                                    required
                                    error={errors.nid?.message}
                                    hint="Included in your application for administrator review."
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        id="tech-nid"
                                        type="text"
                                        autoComplete="off"
                                        required
                                        {...register('nid', { required: 'National ID is required.', validate: notBlank('National ID cannot be blank.') })}
                                        aria-invalid={errors.nid ? 'true' : 'false'}
                                        aria-describedby={errors.nid ? 'tech-nid-error' : 'tech-nid-hint'}
                                        placeholder="National ID"
                                    />
                                </FormField>
                            </div>
                        </section>

                        <fieldset
                            className="min-w-0 overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card"
                            aria-describedby={expertiseError ? 'expertise-error' : 'expertise-help'}
                        >
                            <legend className="sr-only">Technician expertise</legend>
                            <div className="p-5 sm:p-6">
                                <p className="ds-label text-ds-muted-foreground">What you repair</p>
                                <h2 className="mt-2 text-heading text-ds-foreground">Technician expertise</h2>
                                <p id="expertise-help" className="mt-1 text-body-sm text-ds-muted-foreground">
                                    Select at least one product and repair category, then enter whole years of experience from 0 to {MAX_EXPERIENCE_YEARS}.
                                </p>
                            </div>

                            <ExpertisePicker
                                selections={expertise}
                                onToggleProduct={toggleProduct}
                                onToggleRepair={toggleRepair}
                                onYears={setYears}
                                error={expertiseError}
                            />
                        </fieldset>

                        <section className="border-t border-ds-border pt-6" aria-labelledby="submit-application-title">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                <div className="max-w-xl">
                                    <p className="ds-label text-ds-muted-foreground">Review and submit</p>
                                    <h2 id="submit-application-title" className="mt-2 text-heading text-ds-foreground">Check your application details.</h2>
                                    <p className="mt-1 text-body-sm text-ds-muted-foreground">
                                        Submitting sends the information above for administrator review. Your application remains pending until a decision is made.
                                    </p>
                                </div>
                                <LoadingButton
                                    type="submit"
                                    variant="action"
                                    size="lg"
                                    loading={submitting}
                                    loadingText="Submitting application..."
                                    className="w-full shrink-0 sm:w-auto"
                                >
                                    Apply as a Technician
                                </LoadingButton>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BecomeTechnician;
