import { FaCheckCircle, FaLightbulb } from 'react-icons/fa';
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
// alone. No delivery dates, no promise these will definitely ship.
const ScopeAndFuture = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Transparency"
            title="Current Scope and Future Direction"
            description="What Sarabo currently supports, and the directions it may take next."
        />
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-base-300 bg-base-100 p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FaCheckCircle className="text-success" aria-hidden="true" />
                    Currently Implemented
                </h3>
                <ul className="mt-4 flex flex-col gap-2 text-sm opacity-80">
                    {currentScope.map(item => <li key={item}>{item}</li>)}
                </ul>
            </div>
            <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FaLightbulb className="text-brand-priority" aria-hidden="true" />
                    Planned / Future Direction
                </h3>
                <p className="mt-2 text-xs italic opacity-60">
                    Not yet implemented. Sarabo's future direction may include the items below.
                </p>
                <ul className="mt-4 flex flex-col gap-2 text-sm opacity-80">
                    {futureDirection.map(item => <li key={item}>{item}</li>)}
                </ul>
            </div>
        </div>
    </section>
);

export default ScopeAndFuture;
