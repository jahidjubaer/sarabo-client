import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useLoaderData } from 'react-router';
import Swal from 'sweetalert2';
import { getTechnicianApplicationErrorMessage } from '../../utils/technicianApplicationErrorMessage';

const notBlank = message => value => (value && value.trim().length > 0) || message;

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
    const regionsDuplicate = serviceAreas.map(c => c.region);

    const regions = [...new Set(regionsDuplicate)];
    // explore useMemo useCallback
    const districtsByRegion = (region) => {
        const regionDistricts = serviceAreas.filter(c => c.region === region);
        const districts = regionDistricts.map(d => d.district);
        return districts;
    }

    const technicianRegion = useWatch({ control, name: 'region' });

    const handleTechnicianApplication = data => {
        if (submitting) return;
        setSubmitting(true);

        axiosSecure.post('/riders', data)
            .then(res => {
                if (res.data.insertedId) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your application has been submitted. We will reach to you in 1-5 days",
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('Technician application submission failed:', error);
                Swal.fire({ icon: 'error', title: 'Could not submit application', text: getTechnicianApplicationErrorMessage(error) });
            })
            .finally(() => setSubmitting(false));
    }
    return (
        <div>
            <h2 className="text-4xl font-bold">Become a Technician</h2>
            <form onSubmit={handleSubmit(handleTechnicianApplication)} noValidate className='mt-12 p-4 text-black'>

                {/* two column */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
                    {/* technician details */}

                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Technician Details</h4>
                        {/* technician name */}
                        <label className="label">Technician Name</label>
                        <input type="text"
                            {...register('name', {
                                required: 'Name is required.',
                                validate: notBlank('Name cannot be blank.')
                            })}
                            defaultValue={user?.displayName}
                            className={`input w-full ${errors.name ? 'input-error' : ''}`}
                            aria-invalid={errors.name ? 'true' : 'false'}
                            placeholder="Your Name" />
                        {errors.name && <p role="alert" className="text-red-500 text-sm mt-1">{errors.name.message}</p>}

                        {/* technician email */}
                        <label className="label">Email</label>
                        <input type="text"
                            {...register('email', {
                                required: 'Email is required.',
                                validate: notBlank('Email cannot be blank.')
                            })}
                            defaultValue={user?.email}
                            className={`input w-full ${errors.email ? 'input-error' : ''}`}
                            aria-invalid={errors.email ? 'true' : 'false'}
                            placeholder="Your Email" />
                        {errors.email && <p role="alert" className="text-red-500 text-sm mt-1">{errors.email.message}</p>}

                        {/* technician region */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Regions</legend>
                            <select
                                {...register('region', {
                                    validate: value => (value && value !== 'Pick a region') || 'Please select a region.'
                                })}
                                defaultValue="Pick a region"
                                className={`select ${errors.region ? 'select-error' : ''}`}
                                aria-invalid={errors.region ? 'true' : 'false'}>
                                <option disabled={true}>Pick a region</option>
                                {
                                    regions.map((r, i) => <option key={i} value={r}>{r}</option>)
                                }
                            </select>
                            {errors.region && <p role="alert" className="text-red-500 text-sm mt-1">{errors.region.message}</p>}
                        </fieldset>

                        {/* technician districts */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Districts</legend>
                            <select
                                {...register('district', {
                                    validate: value => (value && value !== 'Pick a district') || 'Please select a district.'
                                })}
                                defaultValue="Pick a district"
                                className={`select ${errors.district ? 'select-error' : ''}`}
                                aria-invalid={errors.district ? 'true' : 'false'}>
                                <option disabled={true}>Pick a district</option>
                                {
                                    districtsByRegion(technicianRegion).map((r, i) => <option key={i} value={r}>{r}</option>)
                                }
                            </select>
                            {errors.district && <p role="alert" className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
                        </fieldset>


                        {/* technician address */}
                        <label className="label mt-4">Your Service Address</label>
                        <input type="text"
                            {...register('address', {
                                required: 'Address is required.',
                                validate: notBlank('Address cannot be blank.')
                            })}
                            className={`input w-full ${errors.address ? 'input-error' : ''}`}
                            aria-invalid={errors.address ? 'true' : 'false'}
                            placeholder="Your Address" />
                        {errors.address && <p role="alert" className="text-red-500 text-sm mt-1">{errors.address.message}</p>}


                    </fieldset>
                    {/* additional details */}
                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Skills & Experience</h4>
                        {/* skills */}
                        <label className="label">Skills / Specialization</label>
                        <input type="text"
                            {...register('license', {
                                required: 'Skills / specialization is required.',
                                validate: notBlank('Skills / specialization cannot be blank.')
                            })}
                            className={`input w-full ${errors.license ? 'input-error' : ''}`}
                            aria-invalid={errors.license ? 'true' : 'false'}
                            placeholder="e.g. AC, Refrigerator, Washing Machine" />
                        {errors.license && <p role="alert" className="text-red-500 text-sm mt-1">{errors.license.message}</p>}

                        {/* national id */}
                        <label className="label">National ID (NID)</label>
                        <input type="text"
                            {...register('nid', {
                                required: 'National ID is required.',
                                validate: notBlank('National ID cannot be blank.')
                            })}
                            className={`input w-full ${errors.nid ? 'input-error' : ''}`}
                            aria-invalid={errors.nid ? 'true' : 'false'}
                            placeholder="NID" />
                        {errors.nid && <p role="alert" className="text-red-500 text-sm mt-1">{errors.nid.message}</p>}


                        {/* experience */}
                        <label className="label mt-4">Years of Experience</label>
                        <input type="text"
                            {...register('bike', {
                                required: 'Years of experience is required.',
                                validate: value => {
                                    if (!value || !value.trim()) return 'Years of experience cannot be blank.';
                                    const years = Number(value);
                                    if (Number.isNaN(years) || years < 0) return 'Enter a valid number of years.';
                                    return true;
                                }
                            })}
                            className={`input w-full ${errors.bike ? 'input-error' : ''}`}
                            aria-invalid={errors.bike ? 'true' : 'false'}
                            placeholder="Years of Experience" />
                        {errors.bike && <p role="alert" className="text-red-500 text-sm mt-1">{errors.bike.message}</p>}


                    </fieldset>
                </div>
                <input type="submit" disabled={submitting} className='btn btn-primary mt-8' value={submitting ? 'Submitting Application...' : 'Apply as a Technician'} />
            </form>
        </div>
    );
};

export default BecomeTechnician;
