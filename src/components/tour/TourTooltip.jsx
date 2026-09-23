import { X } from 'lucide-react';
import { Button } from '../ui/button';

function TourTooltip({
    backProps,
    closeProps,
    index,
    isLastStep,
    primaryProps,
    size,
    skipProps,
    step,
    tooltipProps,
}) {
    const titleId = `sarabo-tour-title-${index}`;
    const contentId = `sarabo-tour-content-${index}`;

    return (
        <div
            {...tooltipProps}
            aria-labelledby={titleId}
            aria-describedby={contentId}
            className="relative w-[min(22rem,calc(100vw-2rem))] rounded-ds-lg border border-ds-border bg-ds-popover p-5 text-ds-popover-foreground shadow-lg"
        >
            <button
                {...closeProps}
                type="button"
                className="focus-ring absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-ds text-ds-muted-foreground transition-colors hover:bg-ds-muted hover:text-ds-foreground"
            >
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only">Close tour</span>
            </button>

            <p className="ds-label pr-10 text-ds-primary" aria-label={`Step ${index + 1} of ${size}`}>
                {index + 1} of {size}
            </p>
            <h2 id={titleId} className="mt-3 pr-8 text-heading text-ds-popover-foreground">
                {step.title}
            </h2>
            <div id={contentId} className="mt-3 text-body-sm text-ds-muted-foreground">
                {step.content}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ds-border pt-4">
                <Button {...skipProps} variant="ghost" size="sm" className="mr-auto">
                    Skip tour
                </Button>
                {index > 0 && (
                    <Button {...backProps} variant="outline" size="sm">
                        Back
                    </Button>
                )}
                <Button {...primaryProps} variant="default" size="sm">
                    {isLastStep ? 'Finish tour' : 'Next'}
                </Button>
            </div>
        </div>
    );
}

export default TourTooltip;
