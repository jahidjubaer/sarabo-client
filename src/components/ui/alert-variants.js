import { cva } from 'class-variance-authority';

// In its own module so alert.jsx only exports components (fast-refresh rule).
// Tones follow the badge scale; `danger`/`warning`/`info` stay as the names
// existing call sites use.
export const alertVariants = cva(
    "relative w-full rounded-ds-lg border px-4 py-3 text-body-sm grid grid-cols-[0_1fr] gap-y-0.5 has-[>svg]:grid-cols-[1.25rem_1fr] has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5",
    {
        variants: {
            tone: {
                neutral: "border-ds-border bg-ds-card text-ds-card-foreground [&>svg]:text-ds-muted-foreground",
                info: "border-transparent bg-ds-active-subtle text-ds-foreground [&>svg]:text-ds-active-subtle-foreground",
                success: "border-transparent bg-ds-success-subtle text-ds-foreground [&>svg]:text-ds-success-subtle-foreground",
                warning: "border-transparent bg-ds-attention-subtle text-ds-foreground [&>svg]:text-ds-attention-subtle-foreground",
                danger: "border-transparent bg-ds-danger-subtle text-ds-foreground [&>svg]:text-ds-danger-subtle-foreground",
            },
        },
        defaultVariants: {
            tone: "neutral",
        },
    }
);
