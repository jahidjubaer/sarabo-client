import { cva } from 'class-variance-authority';

// In its own module so badge.jsx only exports a component (fast-refresh rule).
// Tones map to the `ds-` semantic scale; meaning is always paired with label
// text (never colour alone) by the consumers.
// Phase 0: status badges became full-round pills with slightly more weight.
// Meaning is still carried by label + icon, never colour alone.
export const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
    {
        variants: {
            tone: {
                neutral: "border-ds-border bg-ds-muted text-ds-muted-foreground",
                info: "border-ds-info/25 bg-ds-info/10 text-ds-info",
                success: "border-ds-success/25 bg-ds-success/10 text-ds-success",
                warning: "border-ds-warning/25 bg-ds-warning/10 text-ds-warning",
                danger: "border-ds-destructive/25 bg-ds-destructive/10 text-ds-destructive",
                accent: "border-ds-primary/25 bg-ds-primary/10 text-ds-primary",
                solid: "border-transparent bg-ds-primary text-ds-primary-foreground",
                outline: "border-ds-border bg-transparent text-ds-foreground",
            },
        },
        defaultVariants: {
            tone: "neutral",
        },
    }
);
