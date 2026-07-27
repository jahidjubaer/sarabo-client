import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLoaderData, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useAuth from '../../../hooks/useAuth';
import { formatCurrency } from '../../../utils/formatCurrency';

const notBlank = message => value => (value && value.trim().length > 0) || message;

const CreateRequest = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm();
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const serviceAreas = useLoaderData();
    const regionsDuplicate = serviceAreas.map(c => c.region);

    const regions = [...new Set(regionsDuplicate)];
    // explore useMemo useCallback
    const senderRegion = useWatch({ control, name: 'senderRegion' });

    const districtsByRegion = (region) => {
        const regionDistricts = serviceAreas.filter(c => c.region === region);
        const districts = regionDistricts.map(d => d.district);
        return districts;
    }

    const deviceCategories = ['AC', 'Refrigerator', 'Washing Machine', 'TV / Electronics', 'Mobile Phone', 'Laptop / Computer', 'Microwave', 'Other'];
    const priorities = ['normal', 'urgent', 'emergency'];


    const handleCreateRequest = data => {
        console.log(data);

        // a repair request has a single service address (the technician visits this location)
        data.receiverDistrict = data.senderDistrict;

        const isDocument = data.parcelType === 'document';
        const isSameDistrict = data.senderDistrict === data.receiverDistrict;
        const parcelWeight = parseFloat(data.parcelWeight);

        let cost = 0;
        if (isDocument) {
            cost = isSameDistrict ? 60 : 80;
        }
        else {
            if (parcelWeight < 3) {
                cost = isSameDistrict ? 110 : 150;
            }
            else {
                const minCharge = isSameDistrict ? 110 : 150;
                const extraWeight = parcelWeight - 3;
                const extraCharge = isSameDistrict ? extraWeight * 40 : extraWeight * 40 + 40;

                cost = minCharge + extraCharge;
            }
        }

        console.log('cost', cost);
        data.cost = cost;

        Swal.fire({
            title: "Agree with the Cost?",
            text: `You will be charged ${formatCurrency(cost)}!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Confirm and Continue Payment!"
        }).then((result) => {
            if (result.isConfirmed) {

                // save the repair request to the database
                axiosSecure.post('/parcels', data)
                    .then(res => {
                        console.log('after saving request', res.data);
                        if (res.data.insertedId) {
                            navigate('/dashboard/my-requests')
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "Request has been created. Please Pay",
                                showConfirmButton: false,
                                timer: 2500
                            });
                        }
                    })


            }
        });

    }

    return (
        <div>
            <h2 className="text-4xl font-bold">Create Repair Request</h2>
            <form onSubmit={handleSubmit(handleCreateRequest)} noValidate className='mt-12 p-4 text-black'>
                {/* service mode */}
                <div>
                    <label className="label mr-4">
                        <input type="radio" {...register('parcelType')} value="document" className="radio" defaultChecked />
                        On-Site Repair
                    </label>
                    <label className="label">
                        <input type="radio" {...register('parcelType')} value="non-document" className="radio" />
                        Drop-off Repair
                    </label>
                </div>

                {/* device info: name, weight */}
                <h4 className="text-2xl font-semibold mt-8">Device Details</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-12 my-8'>
                    <fieldset className="fieldset">
                        <label className="label">Device Name</label>
                        <input type="text"
                            {...register('parcelName', {
                                required: 'Device name is required.',
                                validate: notBlank('Device name cannot be blank.')
                            })}
                            className={`input w-full ${errors.parcelName ? 'input-error' : ''}`}
                            aria-invalid={errors.parcelName ? 'true' : 'false'}
                            placeholder="e.g. Samsung Refrigerator" />
                        {errors.parcelName && <p role="alert" className="text-red-500 text-sm mt-1">{errors.parcelName.message}</p>}
                    </fieldset>
                    <fieldset className="fieldset">
                        <label className="label">Device Weight (kg)</label>
                        <input type="number" step="any"
                            {...register('parcelWeight', {
                                required: 'Device weight is required.',
                                validate: value => {
                                    const weight = parseFloat(value);
                                    if (Number.isNaN(weight)) return 'Enter a valid weight.';
                                    if (weight <= 0) return 'Weight must be greater than 0.';
                                    return true;
                                }
                            })}
                            className={`input w-full ${errors.parcelWeight ? 'input-error' : ''}`}
                            aria-invalid={errors.parcelWeight ? 'true' : 'false'}
                            placeholder="Device Weight" />
                        {errors.parcelWeight && <p role="alert" className="text-red-500 text-sm mt-1">{errors.parcelWeight.message}</p>}
                    </fieldset>

                </div>

                {/* two column */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
                    {/* customer Details */}

                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Customer Details</h4>
                        {/* customer name */}
                        <label className="label">Your Name</label>
                        <input type="text"
                            {...register('senderName', {
                                required: 'Your name is required.',
                                validate: notBlank('Your name cannot be blank.')
                            })}
                            defaultValue={user?.displayName}
                            className={`input w-full ${errors.senderName ? 'input-error' : ''}`}
                            aria-invalid={errors.senderName ? 'true' : 'false'}
                            placeholder="Your Name" />
                        {errors.senderName && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderName.message}</p>}

                        {/* customer email */}
                        <label className="label">Your Email</label>
                        <input type="text"
                            {...register('senderEmail', {
                                required: 'Your email is required.',
                                validate: notBlank('Your email cannot be blank.')
                            })}
                            defaultValue={user?.email}
                            className={`input w-full ${errors.senderEmail ? 'input-error' : ''}`}
                            aria-invalid={errors.senderEmail ? 'true' : 'false'}
                            placeholder="Your Email" />
                        {errors.senderEmail && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderEmail.message}</p>}

                        {/* customer region */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Your Region</legend>
                            <select
                                {...register('senderRegion', {
                                    validate: value => (value && value !== 'Pick a region') || 'Please select a region.'
                                })}
                                defaultValue="Pick a region"
                                className={`select ${errors.senderRegion ? 'select-error' : ''}`}
                                aria-invalid={errors.senderRegion ? 'true' : 'false'}>
                                <option disabled={true}>Pick a region</option>
                                {
                                    regions.map((r, i) => <option key={i} value={r}>{r}</option>)
                                }
                            </select>
                            {errors.senderRegion && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderRegion.message}</p>}
                        </fieldset>

                        {/* customer district */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Your District</legend>
                            <select
                                {...register('senderDistrict', {
                                    validate: value => (value && value !== 'Pick a district') || 'Please select a district.'
                                })}
                                defaultValue="Pick a district"
                                className={`select ${errors.senderDistrict ? 'select-error' : ''}`}
                                aria-invalid={errors.senderDistrict ? 'true' : 'false'}>
                                <option disabled={true}>Pick a district</option>
                                {
                                    districtsByRegion(senderRegion).map((r, i) => <option key={i} value={r}>{r}</option>)
                                }
                            </select>
                            {errors.senderDistrict && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderDistrict.message}</p>}
                        </fieldset>


                        {/* phone number */}
                        <label className="label mt-4">Phone Number</label>
                        <input type="tel"
                            {...register('senderPhone', {
                                required: 'Phone number is required.',
                                pattern: {
                                    value: /^[+]?\d{10,15}$/,
                                    message: 'Enter a valid phone number (10-15 digits).'
                                }
                            })}
                            className={`input w-full ${errors.senderPhone ? 'input-error' : ''}`}
                            aria-invalid={errors.senderPhone ? 'true' : 'false'}
                            placeholder="Phone Number" />
                        {errors.senderPhone && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderPhone.message}</p>}

                        {/* service address */}
                        <label className="label mt-4">Service Address</label>
                        <input type="text"
                            {...register('senderAddress', {
                                required: 'Service address is required.',
                                validate: notBlank('Service address cannot be blank.')
                            })}
                            className={`input w-full ${errors.senderAddress ? 'input-error' : ''}`}
                            aria-invalid={errors.senderAddress ? 'true' : 'false'}
                            placeholder="Where should the technician visit?" />
                        {errors.senderAddress && <p role="alert" className="text-red-500 text-sm mt-1">{errors.senderAddress.message}</p>}

                        {/* visit instructions */}
                        <label className="label mt-4">Visit / Access Instructions (optional)</label>
                        <textarea {...register('visitInstructions')} className="textarea w-full" placeholder="e.g. gate code, floor, best time to call"></textarea>


                    </fieldset>
                    {/* Device Information */}
                    <fieldset className="fieldset">
                        <h4 className="text-2xl font-semibold">Device Information</h4>
                        {/* serial number */}
                        <label className="label">Serial Number (optional)</label>
                        <input type="text" {...register('receiverName')} className="input w-full" placeholder="Serial Number (optional)" />

                        {/* brand / model */}
                        <label className="label">Brand / Model</label>
                        <input type="text"
                            {...register('receiverEmail', {
                                required: 'Brand / Model is required.',
                                validate: notBlank('Brand / Model cannot be blank.')
                            })}
                            className={`input w-full ${errors.receiverEmail ? 'input-error' : ''}`}
                            aria-invalid={errors.receiverEmail ? 'true' : 'false'}
                            placeholder="Brand / Model" />
                        {errors.receiverEmail && <p role="alert" className="text-red-500 text-sm mt-1">{errors.receiverEmail.message}</p>}

                        {/* device category */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Device Category</legend>
                            <select
                                {...register('receiverRegion', {
                                    validate: value => (value && value !== 'Pick a category') || 'Please select a device category.'
                                })}
                                defaultValue="Pick a category"
                                className={`select ${errors.receiverRegion ? 'select-error' : ''}`}
                                aria-invalid={errors.receiverRegion ? 'true' : 'false'}>
                                <option disabled={true}>Pick a category</option>
                                {
                                    deviceCategories.map((c, i) => <option key={i} value={c}>{c}</option>)
                                }
                            </select>
                            {errors.receiverRegion && <p role="alert" className="text-red-500 text-sm mt-1">{errors.receiverRegion.message}</p>}
                        </fieldset>

                        {/* priority */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Priority</legend>
                            <select {...register('priority')} defaultValue="normal" className="select">
                                {
                                    priorities.map((p, i) => <option key={i} value={p}>{p}</option>)
                                }
                            </select>
                        </fieldset>


                        {/* problem description */}
                        <label className="label mt-4">Problem Description</label>
                        <textarea
                            {...register('receiverAddress', {
                                required: 'Problem description is required.',
                                validate: notBlank('Problem description cannot be blank.')
                            })}
                            className={`textarea w-full ${errors.receiverAddress ? 'textarea-error' : ''}`}
                            aria-invalid={errors.receiverAddress ? 'true' : 'false'}
                            placeholder="Describe the issue with your device"></textarea>
                        {errors.receiverAddress && <p role="alert" className="text-red-500 text-sm mt-1">{errors.receiverAddress.message}</p>}


                    </fieldset>
                </div>
                <input type="submit" className='btn btn-primary mt-8 text-black' value="Create Repair Request" />
            </form>
        </div>
    );
};

export default CreateRequest;
