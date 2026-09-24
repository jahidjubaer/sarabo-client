import { useMemo } from 'react';
import { Check, LoaderCircle, Wrench } from 'lucide-react';
import { useServiceDefinitions } from '../../hooks/useServiceDefinitions';
import {
    normalizeServiceDefinitions, deriveProductCategories, getServicesForProduct, humanizeSlug,
} from '../../utils/serviceDefinitionCatalog';
import { deriveLevelForYears, MAX_EXPERIENCE_YEARS } from '../../utils/technicianExpertiseForm';
import { FormField } from '../common/FormField';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

function CheckboxControl({ checked, onChange, children, className, labelClassName, ...props }) {
    return (
        <label className={cn('flex min-w-0 cursor-pointer items-start gap-3 text-body-sm text-ds-foreground', className)}>
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={onChange}
                {...props}
            />
            <span
                aria-hidden="true"
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-ds-sm border border-ds-input bg-ds-background transition-colors peer-checked:border-ds-primary peer-checked:bg-ds-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ds-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ds-card"
            >
                <Check className={cn('size-3 text-ds-primary-foreground', checked ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
            </span>
            <span className={cn('min-w-0 break-words', labelClassName)}>{children}</span>
        </label>
    );
}

// The technician expertise picker (products -> repairs handled -> years),
// shared by the "Become a technician" application and the technician's own
// profile editor. The catalogue comes from the public service definitions; the
// level is derived from the years, exactly as the server validates it.
export function ExpertisePicker({ selections, onToggleProduct, onToggleRepair, onYears, error, errorId = 'expertise-error' }) {
    const { data: rawDefinitions, isLoading, isError } = useServiceDefinitions();
    const definitions = useMemo(() => normalizeServiceDefinitions(rawDefinitions), [rawDefinitions]);
    const productCategories = useMemo(() => deriveProductCategories(definitions), [definitions]);

    return (
        <>
            {isLoading && (
                <div className="flex items-center gap-3 border-t border-ds-border px-5 py-6 text-body-sm text-ds-muted-foreground sm:px-6" role="status" aria-live="polite">
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-ds-primary" />
                    Loading repair categories…
                </div>
            )}

            {isError && (
                <div className="border-t border-ds-border p-5 sm:p-6">
                    <Alert tone="danger">
                        <Wrench aria-hidden="true" />
                        <AlertTitle>Repair categories could not be loaded</AlertTitle>
                        <AlertDescription>Please refresh and try again.</AlertDescription>
                    </Alert>
                </div>
            )}

            {!isLoading && !isError && productCategories.length === 0 && (
                <p className="border-t border-ds-border px-5 py-6 text-body-sm text-ds-muted-foreground sm:px-6">
                    No repair categories are available right now.
                </p>
            )}

            {productCategories.length > 0 && (
                <div className="border-t border-ds-border">
                    {productCategories.map((product) => {
                        const selected = !!selections[product.slug];
                        const state = selections[product.slug] || { repairSlugs: [], experienceYears: '' };
                        const services = getServicesForProduct(definitions, product.slug);
                        const level = deriveLevelForYears(state.experienceYears);
                        const repairsId = `repairs-${product.slug}`;
                        const levelId = `level-${product.slug}`;
                        return (
                            <div key={product.slug} className="border-b border-ds-border last:border-b-0">
                                <CheckboxControl
                                    className="px-5 py-4 transition-colors hover:bg-ds-muted/50 sm:px-6"
                                    labelClassName="font-semibold"
                                    checked={selected}
                                    onChange={() => onToggleProduct(product.slug)}
                                    // aria-expanded is not valid on a checkbox; aria-controls
                                    // still points at the repair list the tick reveals.
                                    aria-controls={selected ? repairsId : undefined}
                                >
                                    {product.label}
                                </CheckboxControl>

                                {selected && (
                                    <div id={repairsId} className="space-y-5 border-t border-ds-border bg-ds-muted/40 px-5 py-5 sm:px-6 sm:pl-12">
                                        <fieldset>
                                            <legend className="text-body-sm font-semibold text-ds-foreground">Repairs you handle</legend>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {services.map((svc) => (
                                                    <CheckboxControl
                                                        key={svc.repairCategorySlug}
                                                        checked={state.repairSlugs.includes(svc.repairCategorySlug)}
                                                        onChange={() => onToggleRepair(product.slug, svc.repairCategorySlug)}
                                                    >
                                                        {humanizeSlug(svc.repairCategorySlug)}
                                                    </CheckboxControl>
                                                ))}
                                            </div>
                                        </fieldset>

                                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                            <FormField
                                                id={`years-${product.slug}`}
                                                label="Years of experience"
                                                required={state.repairSlugs.length > 0}
                                                hint={`Enter a whole number from 0 to ${MAX_EXPERIENCE_YEARS}.`}
                                            >
                                                <Input
                                                    id={`years-${product.slug}`}
                                                    type="number"
                                                    min="0"
                                                    max={MAX_EXPERIENCE_YEARS}
                                                    inputMode="numeric"
                                                    required={state.repairSlugs.length > 0}
                                                    value={state.experienceYears}
                                                    onChange={(e) => onYears(product.slug, e.target.value)}
                                                    className="w-full sm:w-32"
                                                    aria-describedby={level ? levelId : `years-${product.slug}-hint`}
                                                    placeholder="0"
                                                />
                                            </FormField>
                                            {level && (
                                                <p id={levelId} className="text-body-sm text-ds-muted-foreground sm:pb-2">
                                                    Derived level: <span className="font-semibold text-ds-foreground">{humanizeSlug(level)}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {error && (
                <div className="border-t border-ds-border p-5 sm:p-6">
                    <Alert id={errorId} tone="danger">
                        <Wrench aria-hidden="true" />
                        <AlertTitle>Review your expertise</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    );
}
