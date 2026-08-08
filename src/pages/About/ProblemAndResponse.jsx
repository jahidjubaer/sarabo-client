import { Check, X } from 'lucide-react';
import SectionHeader from '../../components/public/SectionHeader';

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

// Careful wording throughout - "designed to reduce", "helps organize" - no
// claim that Sarabo fully eliminates every listed problem, no market-research
// or survey citation. (Phase 7.9: ds-*/Lucide.)
const ProblemAndResponse = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
            <SectionHeader
                eyebrow="Why Sarabo"
                title="The problem and Sarabo's response"
                description="Repair services are often difficult to follow once a request is made. Sarabo is designed to reduce that uncertainty and provide a clearer workflow."
            />
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="text-base font-semibold text-ds-foreground">Common repair-service problems</h3>
                    <ul className="mt-4 flex flex-col gap-3">
                        {problems.map((problem) => (
                            <li key={problem} className="flex items-start gap-3 text-sm text-ds-muted-foreground">
                                <X className="mt-0.5 size-4 shrink-0 text-ds-destructive" aria-hidden="true" />
                                {problem}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                    <h3 className="text-base font-semibold text-ds-foreground">How Sarabo helps organize the process</h3>
                    <ul className="mt-4 flex flex-col gap-3">
                        {responses.map((response) => (
                            <li key={response} className="flex items-start gap-3 text-sm text-ds-muted-foreground">
                                <Check className="mt-0.5 size-4 shrink-0 text-ds-success" aria-hidden="true" />
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
