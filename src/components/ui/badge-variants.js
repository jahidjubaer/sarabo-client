import { cva } from 'class-variance-authority';

// In its own module so badge.jsx only exports a component (fast-refresh rule).
//
// Redesign Phase 1 status tones (see config/status):
//   waiting    someone else has to act      (slate)
//   active     work is happening            (blue)
//   attention  the viewer has to act        (amber - reserved for this)
//   success / danger / neutral
// The earlier tone names stay as aliases so existing call sites keep working:
// info and accent read as `active`, warning reads as `attention`.
// Meaning is always carried by label (+ icon), never by colour alone.
const WAITING = "bg-ds-waiting-subtle text-ds-waiting-subtle-foreground";
const ACTIVE = "bg-ds-active-subtle text-ds-active-subtle-foreground";
const ATTENTION = "bg-ds-attention-subtle text-ds-attention-subtle-foreground";

export const badgeVariants = cva(
    "inline-flex h-6 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-micro font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
    {
        variants: {
            tone: {
                neutral: "bg-ds-neutral-subtle text-ds-neutral-subtle-foreground",
                waiting: WAITING,
                active: ACTIVE,
                attention: ATTENTION,
                success: "bg-ds-success-subtle text-ds-success-subtle-foreground",
                danger: "bg-ds-danger-subtle text-ds-danger-subtle-foreground",
                info: ACTIVE,
                accent: ACTIVE,
                warning: ATTENTION,
                solid: "bg-ds-primary text-ds-primary-foreground",
                outline: "border-ds-border bg-transparent text-ds-foreground",
            },
            size: {
                default: "",
                lg: "h-7 px-3 text-body-sm [&_svg]:size-4",
            },
        },
        defaultVariants: {
            tone: "neutral",
            size: "default",
        },
    }
);
