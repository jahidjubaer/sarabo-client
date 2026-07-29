import SectionHeader from '../../../components/public/SectionHeader';

const faqs = [
    {
        question: 'How do I submit a repair request?',
        answer: 'Create or sign in to your account, open the repair-request form, and provide the device and issue details requested by the form.',
    },
    {
        question: 'Can I track a repair without opening the dashboard?',
        answer: 'Yes. Use the public tracking page and enter the repair tracking information provided for the request.',
    },
    {
        question: 'How is a technician assigned?',
        answer: "An approved technician is assigned through Sarabo's managed service workflow based on the available request and administrative process.",
    },
    {
        question: 'When is payment required?',
        answer: 'Payment depends on the applicable repair workflow. Where online payment is available, the platform validates the amount and payment confirmation before recording the result.',
    },
    {
        question: 'Can I cancel a repair request?',
        answer: 'Eligible requests can be cancelled before the repair progresses beyond the allowed cancellation stage. The platform prevents cancellation when the request is already too far in the workflow.',
    },
    {
        question: 'How can I become a technician?',
        answer: 'Submit the technician application form. An administrator reviews the application before technician access is approved.',
    },
];

// Native <details>/<summary> - no JS state, keyboard-accessible by default in
// every evergreen browser. `summary` itself carries the question as its
// accessible name, so no additional heading is needed per question; only one
// real heading (the SectionHeader's h2) exists in this whole section.
const FAQ = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Support"
            title="Frequently Asked Questions"
            description="Answers to common questions about using Sarabo."
        />
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-base-300">
            {faqs.map(faq => (
                <details key={faq.question} className="group py-4">
                    <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <span className="shrink-0 text-lg text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="mt-3 text-sm opacity-70">{faq.answer}</p>
                </details>
            ))}
        </div>
    </section>
);

export default FAQ;
