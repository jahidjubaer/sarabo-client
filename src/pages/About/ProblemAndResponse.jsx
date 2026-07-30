import { FaCheck, FaTimes } from 'react-icons/fa';
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
// or survey citation.
const ProblemAndResponse = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Why Sarabo"
            title="The Problem and Sarabo's Response"
            description="Repair services are often difficult to follow once a request is made. Sarabo is designed to reduce that uncertainty and provide a clearer workflow."
        />
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
                <h3 className="text-lg font-semibold">Common Repair-Service Problems</h3>
                <ul className="mt-4 flex flex-col gap-3">
                    {problems.map(problem => (
                        <li key={problem} className="flex items-start gap-3 text-sm opacity-80">
                            <FaTimes className="mt-1 shrink-0 text-error" aria-hidden="true" />
                            {problem}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-semibold">How Sarabo Helps Organize the Process</h3>
                <ul className="mt-4 flex flex-col gap-3">
                    {responses.map(response => (
                        <li key={response} className="flex items-start gap-3 text-sm opacity-80">
                            <FaCheck className="mt-1 shrink-0 text-success" aria-hidden="true" />
                            {response}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
);

export default ProblemAndResponse;
