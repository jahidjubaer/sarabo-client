import { Star } from 'lucide-react';

// Decorative only. The adjacent rating text is the accessible equivalent.
// Clipping represents the displayed fraction without an interactive widget.
export function ReviewStars({ rating }) {
    return (
        <span aria-hidden="true" className="inline-flex shrink-0 gap-1">
            {[0, 1, 2, 3, 4].map((index) => <span key={index} className="relative block size-4">
                <Star className="size-4 text-ds-border" />
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, rating - index)) * 100}%` }}>
                    <Star className="size-4 max-w-none fill-ds-action text-ds-action" />
                </span>
            </span>)}
        </span>
    );
}

export default function TechnicianReviewSummary({ averageRating, reviewCount }) {
    if (reviewCount === 0 && (averageRating === null || averageRating === undefined)) return (
        <div className="space-y-1 rounded-ds border border-ds-border bg-ds-muted/30 p-4">
            <h3 className="text-sm font-semibold">No reviews yet</h3>
            <p className="text-sm text-ds-muted-foreground">There are no visible customer reviews for your account.</p>
        </div>
    );
    // The server may report reviews without a usable average (e.g. a null
    // aggregate); calling toFixed on that would crash the whole profile page.
    if (typeof averageRating !== 'number' || !Number.isFinite(averageRating)) return (
        <div className="space-y-1 rounded-ds border border-ds-border bg-ds-muted/30 p-4">
            <h3 className="text-sm font-semibold">Rating unavailable</h3>
            <p className="text-sm text-ds-muted-foreground">Your average rating could not be shown right now.</p>
        </div>
    );
    // Formatting the server aggregate is not a client-side average calculation.
    const displayedRating = averageRating.toFixed(1);
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-ds-lg bg-ds-muted p-4">
            <h3 className="sr-only">Average customer rating</h3>
            <p className="ds-numeric text-display leading-none text-ds-foreground">
                {displayedRating}<span className="sr-only"> out of 5</span>
                <span aria-hidden="true" className="ml-1 text-body font-normal text-ds-muted-foreground">/ 5</span>
            </p>
            <div className="space-y-1">
                <ReviewStars rating={Number(displayedRating)} />
                <p className="text-body-sm text-ds-muted-foreground">
                    From {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} by verified customers
                </p>
            </div>
        </div>
    );
}
