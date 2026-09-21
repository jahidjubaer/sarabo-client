import { Star } from 'lucide-react';

// Decorative only. The adjacent rating text is the accessible equivalent.
// Clipping represents the displayed fraction without an interactive widget.
export function ReviewStars({ rating }) {
    return (
        <span aria-hidden="true" className="inline-flex shrink-0 gap-1">
            {[0, 1, 2, 3, 4].map((index) => <span key={index} className="relative block size-4">
                <Star className="size-4 text-ds-muted-foreground" />
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, rating - index)) * 100}%` }}>
                    <Star className="size-4 max-w-none fill-ds-primary text-ds-primary" />
                </span>
            </span>)}
        </span>
    );
}

export default function TechnicianReviewSummary({ averageRating, reviewCount }) {
    if (reviewCount === 0 && averageRating === null) return (
        <div className="space-y-1 rounded-ds border border-ds-border bg-ds-muted/30 p-4">
            <h3 className="text-sm font-semibold">No reviews yet</h3>
            <p className="text-sm text-ds-muted-foreground">There are no visible customer reviews for your account.</p>
        </div>
    );
    // Formatting the server aggregate is not a client-side average calculation.
    const displayedRating = averageRating.toFixed(1);
    return (
        <div className="flex flex-col gap-3 rounded-ds border border-ds-border bg-ds-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-ds-muted-foreground">Average customer rating</h3>
                <p aria-label={`Average rating: ${displayedRating} out of 5`} className="text-2xl font-semibold tabular-nums">
                    {displayedRating} <span className="text-sm font-normal text-ds-muted-foreground">/ 5</span>
                </p>
            </div>
            <div className="space-y-1">
                <ReviewStars rating={Number(displayedRating)} />
                <p className="text-sm">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
                <p className="text-xs text-ds-muted-foreground">Based on visible customer reviews.</p>
            </div>
        </div>
    );
}
