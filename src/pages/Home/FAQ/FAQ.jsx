import { Plus } from 'lucide-react';
import { FAQS } from '../../../utils/publicContent';

// Public FAQ (Phase 3). Native <details>/<summary>: no JS state, no new
// dependency, and keyboard-operable by default in every evergreen browser -
// Enter/Space toggles, and the summary carries the question as its accessible
// name, so no per-question heading is needed. Only one real heading (the h2)
// exists in the section.
//
// Answers come from the shared content module and describe how the platform
// actually behaves. No refund, warranty or turnaround promises, because the
// product makes none.
const FAQ = () => (
    <section className="border-t border-ds-border bg-ds-muted/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div>
                <p className="ds-label text-ds-primary">Questions</p>
                <h2 className="mt-3 text-title text-ds-foreground">Before you hand over your device.</h2>
            </div>

            <div className="flex flex-col">
                {FAQS.map((faq) => (
                    <details key={faq.question} className="group border-b border-ds-border first:border-t">
                        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-body font-semibold text-ds-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                            {faq.question}
                            <Plus
                                aria-hidden="true"
                                className="size-4 shrink-0 text-ds-primary transition-transform group-open:rotate-45 motion-reduce:transition-none"
                            />
                        </summary>
                        <p className="max-w-2xl pb-5 text-body-sm text-ds-muted-foreground">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

export default FAQ;
