import { ArrowRight, Plus, ReceiptText } from 'lucide-react';

const QUOTE_PARTS = ['Labour', 'Parts', 'Additional charges'];

// Explains the existing quote structure without invented amounts or live state.
const QuoteExplainer = () => (
    <section aria-labelledby="home-quote-heading" className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
                <h2 id="home-quote-heading" className="text-title text-ds-foreground">Know what goes into your quote.</h2>
                <p className="mt-4 text-body text-ds-muted-foreground">
                    Catalogue estimates are indicative. After inspection, review the itemised quote before approving repair.
                </p>
            </div>
            <figure className="mt-8 md:mt-10">
                <figcaption className="sr-only">Labour plus parts plus additional charges make up your itemised quote.</figcaption>
                <div aria-hidden="true" className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:flex-row md:gap-3">
                        {QUOTE_PARTS.map((label, index) => (
                            <div key={label} className="flex w-full min-w-0 flex-col items-center gap-2 md:w-auto md:flex-1 md:flex-row md:gap-3">
                                {index > 0 && <Plus className="size-4 shrink-0 text-ds-muted-foreground" />}
                                <p className="flex min-h-16 w-full flex-1 items-center justify-center rounded-ds border border-ds-border bg-ds-muted/50 px-4 py-3 text-center text-sm font-medium text-ds-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                    <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-ds-primary md:rotate-0" />
                    <div className="flex items-center justify-center gap-3 rounded-ds-lg border border-ds-primary/25 bg-ds-accent px-6 py-5 text-ds-accent-foreground md:min-h-24">
                        <ReceiptText className="size-6 shrink-0" />
                        <p className="font-semibold">Itemised quote</p>
                    </div>
                </div>
            </figure>
        </div>
    </section>
);

export default QuoteExplainer;
