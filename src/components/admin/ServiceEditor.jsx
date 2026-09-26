import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { createServiceDefinition, updateServiceDefinition } from '../../api/adminServiceDefinitions';
import { humanizeSlug } from '../../utils/serviceDefinitionCatalog';
import { formatMoney, formatMoneyRange } from '../../utils/currency';
import {
    EXPERTISE_LEVELS, MAX_IMAGE_COUNT, MAX_DURATION_MINUTES, MAX_BASE_PRICE, MAX_INSPECTION_FEE,
    LABEL_MAX_LENGTH, DESCRIPTION_MAX_LENGTH,
    pairKey, toFormValues, toServiceFields, diffServiceChanges, wholeNumberRule,
} from '../../utils/serviceCatalogueForm';
import { notify } from '../../lib/notify';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { MoneyInput } from '../ui/money-input';
import { CheckboxField } from '../ui/checkbox';
import { FormField } from '../common/FormField';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';

const SAVE_ERROR_COPY = {
    SERVICE_DEFINITION_EXISTS: 'A service for this device and repair already exists.',
    BASE_MIN_EXCEEDS_BASE_MAX: 'The lowest price cannot be higher than the highest price.',
    PRODUCT_REPAIR_PAIR_NOT_ALLOWED: 'This repair is not offered for this device.',
    FIELD_NOT_EDITABLE: 'One of these fields cannot be changed.',
    SERVICE_DEFINITION_NOT_FOUND: 'This service no longer exists. Reload the page.',
};

function saveErrorMessage(error) {
    const code = error?.response?.data?.code;
    if (SAVE_ERROR_COPY[code]) return SAVE_ERROR_COPY[code];
    if (error?.response?.status === 400) return 'Some of these values were not accepted. Please review them.';
    return 'The service could not be saved. Please try again.';
}

const serviceName = (productCategorySlug, repairCategorySlug) => `${humanizeSlug(productCategorySlug)} · ${humanizeSlug(repairCategorySlug)}`;

// The form inside the sheet. Mounted fresh each time the sheet opens, so it
// always starts from the stored service.
function ServiceForm({ definition, availablePairs, onSaved, onStale, onDone }) {
    const axiosSecure = useAxiosSecure();
    const isCreate = !definition;
    const { register, handleSubmit, getValues, setError, formState: { errors } } = useForm({ defaultValues: toFormValues(definition) });
    const [formError, setFormError] = useState(null);
    // { changes, priceChanged, waitingRequests } while the admin confirms.
    const [pending, setPending] = useState(null);

    const save = useMutation({
        mutationFn: ({ changes, acknowledgeWaitingRequests, payload }) => (isCreate
            ? createServiceDefinition(axiosSecure, payload)
            : updateServiceDefinition(axiosSecure, definition.id, { expectedUpdatedAt: definition.updatedAt, changes, acknowledgeWaitingRequests })),
        onSuccess: (saved) => {
            setPending(null);
            notify.success(isCreate ? `${saved.label} added.` : `${saved.label} saved.`);
            onSaved();
            onDone();
        },
        onError: (error, variables) => {
            const body = error?.response?.data;
            if (body?.code === 'SERVICE_HAS_WAITING_REQUESTS') {
                // The count changed since the list loaded - confirm again with the server's number.
                setPending({ changes: variables.changes, priceChanged: pending?.priceChanged ?? false, waitingRequests: body.waitingRequests });
                return;
            }
            setPending(null);
            if (body?.code === 'SERVICE_DEFINITION_CHANGED') {
                notify.error('Someone else changed this service. The list has been refreshed - open it again to edit.');
                onStale();
                onDone();
                return;
            }
            setFormError(saveErrorMessage(error));
        },
    });

    const onValid = (values) => {
        setFormError(null);
        const fields = toServiceFields(values);
        if (fields.pricingRule.baseMin > fields.pricingRule.baseMax) {
            setError('baseMax', { message: 'Must be at least the lowest price.' });
            return;
        }
        if (fields.imageRequirements.min > fields.imageRequirements.max) {
            setError('imageMax', { message: 'Must be at least the minimum.' });
            return;
        }
        if (isCreate) {
            const [productCategorySlug, repairCategorySlug] = values.pair.split('/');
            save.mutate({ payload: { productCategorySlug, repairCategorySlug, ...fields } });
            return;
        }
        const { changes, priceChanged, switchingOff } = diffServiceChanges(definition, values);
        if (Object.keys(changes).length === 0) {
            notify.info('Nothing was changed.');
            onDone();
            return;
        }
        const waitingRequests = switchingOff ? definition.waitingRequests : 0;
        if (priceChanged || waitingRequests > 0) {
            setPending({ changes, priceChanged, waitingRequests });
            return;
        }
        save.mutate({ changes });
    };

    const confirm = () => save.mutate({ changes: pending.changes, acknowledgeWaitingRequests: pending.waitingRequests > 0 });

    const pendingPrice = pending?.priceChanged ? toServiceFields(getValues()).pricingRule : null;
    const confirmSummary = pending ? (
        <div className="space-y-2 text-body-sm text-ds-foreground">
            {pendingPrice && (
                <p>
                    New price: <span className="ds-numeric font-semibold">{formatMoneyRange(pendingPrice.baseMin, pendingPrice.baseMax, 'BDT')}</span>
                    {' '}(inspection fee <span className="ds-numeric font-semibold">{formatMoney(pendingPrice.inspectionFee, 'BDT')}</span>).
                    {' '}New requests use this price; existing requests keep the price they were created with.
                </p>
            )}
            {pending.waitingRequests > 0 && (
                <p>
                    <span className="font-semibold">{pending.waitingRequests} request{pending.waitingRequests === 1 ? ' is' : 's are'} waiting for a technician.</span>
                    {' '}They cannot be assigned while this service is off. Customers can no longer choose it.
                </p>
            )}
        </div>
    ) : null;

    return (
        <>
            <form onSubmit={handleSubmit(onValid)} className="flex min-h-0 flex-1 flex-col" noValidate>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6 sm:px-6">
                    {isCreate ? (
                        <FormField id="service-pair" label="Device and repair" required error={errors.pair?.message}>
                            <Select id="service-pair" {...register('pair', { required: 'Choose a device and repair.' })}>
                                <option value="">Choose…</option>
                                {availablePairs.map((pair) => {
                                    const key = pairKey(pair.productCategorySlug, pair.repairCategorySlug);
                                    return <option key={key} value={key}>{serviceName(pair.productCategorySlug, pair.repairCategorySlug)}</option>;
                                })}
                            </Select>
                        </FormField>
                    ) : null}

                    <FormField id="service-label" label="Name" required error={errors.label?.message}>
                        <Input id="service-label" maxLength={LABEL_MAX_LENGTH} {...register('label', {
                            validate: (v) => v.trim().length > 0 || 'Enter a name.',
                            maxLength: { value: LABEL_MAX_LENGTH, message: `At most ${LABEL_MAX_LENGTH} characters.` },
                        })} />
                    </FormField>
                    <FormField id="service-description" label="Description" required hint="Shown to customers when they choose this repair." error={errors.description?.message}>
                        <Textarea id="service-description" rows={3} maxLength={DESCRIPTION_MAX_LENGTH} {...register('description', {
                            validate: (v) => v.trim().length > 0 || 'Enter a description.',
                            maxLength: { value: DESCRIPTION_MAX_LENGTH, message: `At most ${DESCRIPTION_MAX_LENGTH} characters.` },
                        })} />
                    </FormField>

                    <fieldset className="space-y-3">
                        <legend className="text-body-sm font-semibold text-ds-foreground">Price estimate</legend>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField id="service-base-min" label="From (BDT)" required error={errors.baseMin?.message}>
                                <MoneyInput id="service-base-min" inputMode="numeric" {...register('baseMin', wholeNumberRule({ min: 1, max: MAX_BASE_PRICE, label: 'Price' }))} />
                            </FormField>
                            <FormField id="service-base-max" label="To (BDT)" required error={errors.baseMax?.message}>
                                <MoneyInput id="service-base-max" inputMode="numeric" {...register('baseMax', wholeNumberRule({ min: 1, max: MAX_BASE_PRICE, label: 'Price' }))} />
                            </FormField>
                            <FormField id="service-inspection-fee" label="Inspection fee (BDT)" required error={errors.inspectionFee?.message}>
                                <MoneyInput id="service-inspection-fee" inputMode="numeric" {...register('inspectionFee', wholeNumberRule({ min: 0, max: MAX_INSPECTION_FEE, label: 'Fee' }))} />
                            </FormField>
                        </div>
                        {!isCreate && <p className="text-micro text-ds-muted-foreground">Changing a price only affects new requests.</p>}
                    </fieldset>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField id="service-level" label="Technician level needed" required>
                            <Select id="service-level" {...register('requiredExpertiseLevel')}>
                                {EXPERTISE_LEVELS.map((level) => <option key={level} value={level}>{humanizeSlug(level)}</option>)}
                            </Select>
                        </FormField>
                        <FormField id="service-duration" label="Typical time (minutes)" required error={errors.estimatedDurationMinutes?.message}>
                            <Input id="service-duration" inputMode="numeric" {...register('estimatedDurationMinutes', wholeNumberRule({ min: 1, max: MAX_DURATION_MINUTES, label: 'Time' }))} />
                        </FormField>
                    </div>

                    <fieldset className="space-y-3">
                        <legend className="text-body-sm font-semibold text-ds-foreground">Customer photos</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField id="service-image-min" label="Minimum" required error={errors.imageMin?.message}>
                                <Input id="service-image-min" inputMode="numeric" {...register('imageMin', wholeNumberRule({ min: 0, max: MAX_IMAGE_COUNT, label: 'Minimum' }))} />
                            </FormField>
                            <FormField id="service-image-max" label="Maximum" required error={errors.imageMax?.message}>
                                <Input id="service-image-max" inputMode="numeric" {...register('imageMax', wholeNumberRule({ min: 0, max: MAX_IMAGE_COUNT, label: 'Maximum' }))} />
                            </FormField>
                        </div>
                        <CheckboxField label="Recommend photos" description="Customers are encouraged to add photos of the problem." {...register('imageRecommended')} />
                    </fieldset>

                    <div className="space-y-1 border-t border-ds-border pt-4">
                        <CheckboxField label="Inspection required" description="A technician inspects the device before quoting." {...register('inspectionRequired')} />
                        <CheckboxField
                            label="Offered to customers"
                            description={isCreate ? 'Untick to add the service switched off.' : 'When off, customers cannot choose it and waiting requests cannot be assigned.'}
                            {...register('isActive')}
                        />
                    </div>

                    {formError ? <p role="alert" className="text-body-sm font-medium text-ds-destructive">{formError}</p> : null}
                </div>
                <SheetFooter className="border-t border-ds-border">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>Cancel</Button>
                        <LoadingButton type="submit" variant="primary" loading={save.isPending && !pending} loadingText="Saving…">
                            {isCreate ? 'Add service' : 'Save changes'}
                        </LoadingButton>
                    </div>
                </SheetFooter>
            </form>
            <ConfirmDialog
                open={Boolean(pending)}
                onOpenChange={(open) => { if (!open) setPending(null); }}
                title={pending?.waitingRequests > 0 ? 'Switch this service off?' : 'Change the price?'}
                summary={confirmSummary}
                confirmLabel={pending?.waitingRequests > 0 ? 'Switch off and save' : 'Save new price'}
                confirmVariant={pending?.waitingRequests > 0 ? 'destructive' : 'primary'}
                busy={save.isPending}
                busyLabel="Saving…"
                onConfirm={confirm}
            />
        </>
    );
}

// Side panel where an admin adds or edits a catalogue service (quick-wins
// phase). `definition` null means "add". The server re-validates everything
// and refuses stale edits; this panel only confirms the consequential ones.
function ServiceEditor({ open, onOpenChange, definition, availablePairs, onSaved, onStale }) {
    const isCreate = !definition;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-xl">
                <SheetHeader className="border-b border-ds-border">
                    <SheetTitle>{isCreate ? 'Add a service' : definition.label}</SheetTitle>
                    <SheetDescription>
                        {isCreate ? 'Offer a repair for a device that has no service yet.' : serviceName(definition.productCategorySlug, definition.repairCategorySlug)}
                    </SheetDescription>
                </SheetHeader>
                {open && (
                    <ServiceForm
                        definition={definition}
                        availablePairs={availablePairs}
                        onSaved={onSaved}
                        onStale={onStale}
                        onDone={() => onOpenChange(false)}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

export { ServiceEditor };
