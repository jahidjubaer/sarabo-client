import { Plus } from 'lucide-react';

// Home-only copy: keep these answers short without changing shared content.
const QUESTIONS = [
    {
        question: 'How much will my repair cost?',
        answer: 'The catalogue shows indicative estimates. Your Technician provides an itemised quote after inspection.',
    },
    {
        question: 'Can I decline a quote?',
        answer: 'Yes. You can decline the quote; the repair does not go ahead.',
    },
    {
        question: 'How do I track my repair?',
        answer: 'Enter your tracking code on Track a repair without signing in. Your dashboard shows the full details of your own requests.',
    },
    {
        question: 'How is a Technician assigned?',
        answer: 'An Admin assigns an approved Technician whose expertise and service area match your request.',
    },
    {
        question: 'What happens when repair is complete?',
        answer: 'Once the Technician marks the repair complete and you have your device back, confirm receipt in your request details.',
    },
];

const FAQ = () => (
    <section aria-labelledby="home-faq-heading" className="border-t border-ds-border px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
            <h2 id="home-faq-heading" className="text-title text-ds-foreground">A few useful answers</h2>
            <div className="min-w-0">
                {QUESTIONS.map((faq) => (
                    <details key={faq.question} className="group border-b border-ds-border first:border-t">
                        <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-ds py-4 text-body font-semibold text-ds-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                            {faq.question}
                            <Plus aria-hidden="true" className="size-4 shrink-0 text-ds-primary transition-transform group-open:rotate-45 motion-reduce:transition-none" />
                        </summary>
                        <p className="max-w-2xl pb-5 pr-6 text-body text-ds-muted-foreground">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

export default FAQ;
