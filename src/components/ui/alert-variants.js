import { cva } from 'class-variance-authority';

// In its own module so alert.jsx only exports components (fast-refresh rule).
export const alertVariants = cva(
    "relative w-full rounded-ds-lg border px-4 py-3 text-sm grid grid-cols-[0_1fr] gap-y-0.5 has-[>svg]:grid-cols-[1.25rem_1fr] has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5",
    {
        variants: {
            tone: {
                neutral: "border-ds-border bg-ds-card text-ds-card-foreground [&>svg]:text-ds-muted-foreground",
                info: "border-ds-info/30 bg-ds-info/10 text-ds-foreground [&>svg]:text-ds-info",
                success: "border-ds-success/30 bg-ds-success/10 text-ds-foreground [&>svg]:text-ds-success",
                warning: "border-ds-warning/30 bg-ds-warning/10 text-ds-foreground [&>svg]:text-ds-warning",
                danger: "border-ds-destructive/30 bg-ds-destructive/10 text-ds-foreground [&>svg]:text-ds-destructive",
            },
        },
        defaultVariants: {
            tone: "neutral",
        },
    }
);
