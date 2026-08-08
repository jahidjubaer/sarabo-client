import { CheckCircle2, Lightbulb } from 'lucide-react';
import SectionHeader from '../../components/public/SectionHeader';

const currentScope = [
    'Structured repair-request management',
    'Role-based dashboards',
    'Technician approval and assignment',
    'Repair tracking',
    'Supported payment handling',
    'Cancellation and completion workflow',
    'Admin-managed operations',
];

const futureDirection = [
    'In-app notifications',
    'Customer reviews',
    'Repair image uploads',
    'Email verification',
    'Technician quotation and approval workflow',
    'Further service and usability improvements',
];

// The dashed border + distinct icon (not just a colour swap) on the future
// column keeps "planned, not implemented" legible without relying on colour
// alone. No delivery dates, no promise these will definitely ship. (Phase 7.9:
// ds-*/Lucide.)
const ScopeAndFuture = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
            <SectionHeader
                eyebrow="Transparency"
                title="Current scope and future direction"
                description="What Sarabo currently supports, and the directions it may take next."
            />
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-ds-foreground">
                        <CheckCircle2 className="size-5 text-ds-success" aria-hidden="true" />
                        Currently implemented
                    </h3>
                    <ul className="mt-4 flex flex-col gap-2 text-sm text-ds-muted-foreground">
                        {currentScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </div>
                <div className="rounded-ds-lg border border-dashed border-ds-border bg-ds-muted/40 p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-ds-foreground">
                        <Lightbulb className="size-5 text-brand-priority" aria-hidden="true" />
                        Planned / future direction
                    </h3>
                    <p className="mt-2 text-xs italic text-ds-muted-foreground">
                        Not yet implemented. Sarabo's future direction may include the items below.
                    </p>
                    <ul className="mt-4 flex flex-col gap-2 text-sm text-ds-muted-foreground">
                        {futureDirection.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

export default ScopeAndFuture;
