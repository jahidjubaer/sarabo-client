import { Plus } from 'lucide-react';
import SectionHeader from '../../../components/public/SectionHeader';
import { FAQS } from '../../../utils/publicContent';

// Public FAQ (Phase 7.8, ds-*). Native <details>/<summary> - no JS state,
// keyboard-accessible by default in every evergreen browser. `summary` carries
// the question as its accessible name, so no per-question heading is needed;
// only one real heading (SectionHeader's h2) exists in this section. Content
// comes from the content module (existing project copy / safe product facts) -
// no invented refund/warranty/turnaround promises.
const FAQ = () => (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
            eyebrow="Support"
            title="Frequently asked questions"
            description="Answers to common questions about using Sarabo."
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {FAQS.map((faq) => (
                <details key={faq.question} className="group rounded-ds-lg border border-ds-border bg-ds-card p-4">
                    <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ds-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <Plus aria-hidden="true" className="size-4 shrink-0 text-ds-primary transition-transform group-open:rotate-45" />
                    </summary>
                    <p className="mt-3 text-sm text-ds-muted-foreground">{faq.answer}</p>
                </details>
            ))}
        </div>
    </section>
);

export default FAQ;
