import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { technicianKeys } from '../../hooks/technicianKeys';
import { notify } from '../../lib/notify';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { FormField } from '../common/FormField';
import { LoadingButton } from '../common/LoadingButton';

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,18}$/;

const SAVE_ERROR_COPY = {
    TECHNICIAN_HAS_ACTIVE_ASSIGNMENT: 'You can change your service area once your current repair is finished.',
    TECHNICIAN_PROFILE_NOT_FOUND: 'No technician record is linked to this account.',
};

function saveErrorMessage(error) {
    const data = error?.response?.data;
    if (SAVE_ERROR_COPY[data?.code]) return SAVE_ERROR_COPY[data.code];
    if (error?.response?.status === 400 && data?.message) return `Not saved: ${data.message}.`;
    return 'Your details could not be saved. Please try again.';
}

// Same list the application form uses (public/serviceAreas.json).
function useServiceAreas() {
    return useQuery({
        queryKey: ['service-areas'],
        queryFn: async () => {
            const res = await fetch('/serviceAreas.json');
            if (!res.ok) throw new Error('service areas unavailable');
            return res.json();
        },
        staleTime: Infinity,
    });
}

function validate(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Name is required.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) errors.phone = 'Enter a valid phone number, e.g. 01712345678.';
    if (!values.region) errors.region = 'Please select a region.';
    if (!values.district) errors.district = 'Please select a district.';
    if (!values.address.trim()) errors.address = 'Address is required.';
    return errors;
}

// Mounted fresh each time the sheet opens, so it starts from the stored record.
function DetailsForm({ profile, onDone }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const { data: areas = [], isError: areasError } = useServiceAreas();
    const [values, setValues] = useState({
        name: profile.name || '',
        phone: profile.phone || '',
        region: profile.region || '',
        district: profile.district || '',
        address: profile.address || '',
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);

    const regions = useMemo(() => {
        const list = [...new Set(areas.map((area) => area.region))];
        return profile.region && !list.includes(profile.region) ? [profile.region, ...list] : list;
    }, [areas, profile.region]);
    const districts = useMemo(() => {
        const list = areas.filter((area) => area.region === values.region).map((area) => area.district);
        return values.region === profile.region && profile.district && !list.includes(profile.district) ? [profile.district, ...list] : list;
    }, [areas, values.region, profile.region, profile.district]);

    const set = (field) => (event) => {
        const value = event.target.value;
        setValues((current) => (field === 'region' ? { ...current, region: value, district: '' } : { ...current, [field]: value }));
        if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    };

    // PATCH /technicians/me - only the fields that changed are sent.
    const save = useMutation({
        mutationFn: async (payload) => (await axiosSecure.patch('/technicians/me', payload)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: technicianKeys.me() });
            notify.success('Your details were saved.');
            onDone();
        },
        onError: (error) => setFormError(saveErrorMessage(error)),
    });

    const submit = (event) => {
        event.preventDefault();
        const found = validate(values);
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        setFormError(null);

        const payload = {};
        for (const field of ['name', 'phone', 'address']) {
            const value = values[field].trim();
            if (value !== (profile[field] || '')) payload[field] = value;
        }
        if (values.region !== (profile.region || '') || values.district !== (profile.district || '')) {
            payload.region = values.region;
            payload.district = values.district;
        }
        if (Object.keys(payload).length === 0) {
            onDone();
            return;
        }
        save.mutate(payload);
    };

    const fieldProps = (field) => ({
        id: `tech-edit-${field}`,
        value: values[field],
        onChange: set(field),
        disabled: save.isPending,
        'aria-invalid': errors[field] ? 'true' : 'false',
        'aria-describedby': errors[field] ? `tech-edit-${field}-error` : undefined,
    });

    return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 sm:px-6">
                <FormField id="tech-edit-name" label="Name" required error={errors.name}>
                    <Input {...fieldProps('name')} autoComplete="name" />
                </FormField>
                <FormField id="tech-edit-phone" label="Phone" error={errors.phone}>
                    <Input {...fieldProps('phone')} type="tel" autoComplete="tel" placeholder="01712345678" />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField id="tech-edit-region" label="Region" required error={errors.region}>
                        <Select {...fieldProps('region')}>
                            <option value="" disabled>Pick a region</option>
                            {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                        </Select>
                    </FormField>
                    <FormField id="tech-edit-district" label="District" required error={errors.district}>
                        <Select {...fieldProps('district')}>
                            <option value="" disabled>Pick a district</option>
                            {districts.map((district) => <option key={district} value={district}>{district}</option>)}
                        </Select>
                    </FormField>
                </div>
                {areasError && <p className="text-xs text-ds-destructive">The list of areas could not be loaded. Reload the page to change your area.</p>}
                <p className="text-xs text-ds-muted-foreground">Your area decides which repairs you are offered. It can't change while a repair is active.</p>
                <FormField id="tech-edit-address" label="Service address" required error={errors.address}>
                    <Textarea {...fieldProps('address')} rows={3} autoComplete="street-address" />
                </FormField>
                <p className="text-xs text-ds-muted-foreground">Email and NID were checked when you were approved, so ask an admin to change those.</p>
                {formError && <p role="alert" className="text-sm font-medium text-ds-destructive">{formError}</p>}
            </div>
            <SheetFooter className="border-t border-ds-border">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>Cancel</Button>
                    <LoadingButton type="submit" variant="primary" loading={save.isPending} loadingText="Saving…">Save details</LoadingButton>
                </div>
            </SheetFooter>
        </form>
    );
}

// Side panel where a technician edits their own name, phone, area and address.
function TechnicianDetailsEditor({ open, onOpenChange, profile }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle>Edit your details</SheetTitle>
                    <SheetDescription>Contact details and the area you work in.</SheetDescription>
                </SheetHeader>
                {open && <DetailsForm profile={profile} onDone={() => onOpenChange(false)} />}
            </SheetContent>
        </Sheet>
    );
}

export { TechnicianDetailsEditor };
