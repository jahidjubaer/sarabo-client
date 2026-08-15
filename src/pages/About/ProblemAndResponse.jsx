import { Check, X } from 'lucide-react';

// Content unchanged from the reviewed version - all four problems and all six
// responses preserved verbatim, as is the careful wording ("designed to
// reduce", "helps organize"). No claim that Sarabo eliminates every listed
// problem, no survey or market-research citation. (Phase 5A: restyled only.)
const problems = [
    'Unclear service status',
    'Fragmented communication',
    'Uncertain technician accountability',
    'Disconnected payment and completion records',
];

const responses = [
    'Structured request records',
    'Role-based workflow',
    'Approved technician access',
    'Trackable status progression',
    'Server-validated payment handling',
    'Managed completion process',
];

const ProblemAndResponse = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <p className="ds-label text-ds-primary">Why Sarabo</p>
            <h2 className="mt-3 max-w-[22ch] text-title text-ds-foreground">The problem, and Sarabo's response</h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ds-muted-foreground">
                Repair services are often difficult to follow once a request is made. Sarabo is designed to
                reduce that uncertainty and provide a clearer workflow.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="text-subhead text-ds-foreground">Common repair-service problems</h3>
                    <ul className="mt-5 flex flex-col gap-3">
                        {problems.map((problem) => (
                            <li key={problem} className="flex items-start gap-3 text-body-sm text-ds-muted-foreground">
                                <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-destructive" />
                                {problem}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="text-subhead text-ds-foreground">How Sarabo helps organize the process</h3>
                    <ul className="mt-5 flex flex-col gap-3">
                        {responses.map((response) => (
                            <li key={response} className="flex items-start gap-3 text-body-sm text-ds-muted-foreground">
                                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-success" />
                                {response}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

export default ProblemAndResponse;
