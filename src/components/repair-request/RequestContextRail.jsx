import { ClipboardList, MapPin, Wrench } from 'lucide-react';
import ServiceSpine from '../spine/ServiceSpine';
import { SPINE_STAGES } from '../../utils/repairStage';
import EstimateCard from './EstimateCard';

// Context only: no request exists yet. The shared spine accepts a resolved
// presentation model, so the form can show where submission begins without
// fabricating or persisting a deliveryStatus.
const REQUEST_ENTRY_SPINE_MODEL = {
    stage: 1,
    key: SPINE_STAGES[0].key,
    label: SPINE_STAGES[0].label,
    state: 'current',
    terminal: false,
    flow: 'active',
    currentLabel: 'Starts with submission',
    legacy: false,
    unknown: false,
    stages: SPINE_STAGES.map((stage, index) => ({
        ...stage,
        state: index === 0 ? 'current' : 'upcoming',
    })),
};

function ContextRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            {icon}
            <div className="min-w-0">
                <dt className="ds-label text-ds-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-body-sm font-semibold text-ds-foreground">{value}</dd>
            </div>
        </div>
    );
}

function RequestContextRail({ categoryLabel, serviceLabel, serviceAreaLabel, selectedDefinition }) {
    const hasContext = categoryLabel || serviceLabel || serviceAreaLabel;

    return (
        <aside aria-label="Request context" className="min-w-0 space-y-4 xl:sticky xl:top-20">
            <section className="rounded-ds-lg border border-ds-border bg-ds-card p-5 shadow-sm">
                <p className="ds-label text-ds-primary">Request context</p>
                <h2 className="mt-2 text-heading text-ds-foreground">Your selections</h2>

                {hasContext ? (
                    <dl className="mt-5 space-y-4">
                        <ContextRow icon={<ClipboardList aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-primary" />} label="Device category" value={categoryLabel} />
                        <ContextRow icon={<Wrench aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-primary" />} label="Repair service" value={serviceLabel} />
                        <ContextRow icon={<MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-primary" />} label="Service area" value={serviceAreaLabel} />
                    </dl>
                ) : (
                    <p className="mt-3 text-body-sm text-ds-muted-foreground">
                        Choose a device category and repair service to build your request summary.
                    </p>
                )}

                <div className="mt-5 border-t border-ds-border pt-5">
                    {selectedDefinition ? (
                        <EstimateCard definition={selectedDefinition} className="bg-ds-muted/30" />
                    ) : (
                        <div className="rounded-ds-lg border border-dashed border-ds-border bg-ds-muted/20 p-4">
                            <p className="text-body-sm font-semibold text-ds-foreground">Estimate not shown yet</p>
                            <p className="mt-1 text-micro text-ds-muted-foreground">
                                Select a repair service to see its catalogue estimate.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-ds-lg border border-ds-border bg-ds-card p-5 shadow-sm">
                <p className="ds-label text-ds-primary">Repair lifecycle</p>
                <h2 className="mt-2 text-heading text-ds-foreground">Submission is the beginning</h2>
                <p className="mt-2 text-body-sm text-ds-muted-foreground">
                    Creating this request starts the Request stage. Inspection happens before the final repair quote.
                </p>
                <ServiceSpine model={REQUEST_ENTRY_SPINE_MODEL} orientation="vertical" className="mt-5" />
            </section>
        </aside>
    );
}

export default RequestContextRail;
