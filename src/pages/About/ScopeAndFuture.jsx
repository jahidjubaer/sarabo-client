import { CheckCircle2, Lightbulb } from 'lucide-react';

// Content unchanged from the reviewed version - all seven implemented items and
// all six future-direction items preserved verbatim, as is the explicit "not
// yet implemented" caveat. No delivery dates, no promise that any planned item
// will ship. (Phase 5A: restyled only.)
//
// The dashed border plus a distinct icon - not a colour swap - keeps "planned,
// not implemented" legible without relying on colour alone.
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

const ScopeAndFuture = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <p className="ds-label text-ds-primary">Transparency</p>
            <h2 className="mt-3 max-w-[24ch] text-title text-ds-foreground">Current scope and future direction</h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ds-muted-foreground">
                What Sarabo currently supports, and the directions it may take next.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="flex items-center gap-2 text-subhead text-ds-foreground">
                        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-ds-success" />
                        Currently implemented
                    </h3>
                    <ul className="mt-5 flex flex-col gap-2.5">
                        {currentScope.map((item) => (
                            <li key={item} className="text-body-sm text-ds-muted-foreground">{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-ds-lg border border-dashed border-ds-input bg-ds-muted/50 p-6">
                    <h3 className="flex items-center gap-2 text-subhead text-ds-foreground">
                        <Lightbulb aria-hidden="true" className="size-5 shrink-0 text-ds-warning" />
                        Planned / future direction
                    </h3>
                    <p className="mt-2 text-micro italic text-ds-muted-foreground">
                        Not yet implemented. Sarabo&rsquo;s future direction may include the items below.
                    </p>
                    <ul className="mt-5 flex flex-col gap-2.5">
                        {futureDirection.map((item) => (
                            <li key={item} className="text-body-sm text-ds-muted-foreground">{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

export default ScopeAndFuture;
