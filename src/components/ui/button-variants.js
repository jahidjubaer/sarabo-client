import { cva } from 'class-variance-authority';

// Kept in its own module (not button.jsx) so the component file only exports a
// component - satisfies eslint-plugin-react-refresh's fast-refresh boundary
// rule. Import `buttonVariants` here to style a non-<button> element (e.g. a
// router Link) as a button.
//
// Redesign Phase 1 hierarchy:
//   action       Marigold - THE next step. At most one per view.
//   primary      Verdigris - ordinary saves and confirmations. (`default` is
//                the same style, kept so existing call sites keep working.)
//   outline      Secondary alternatives ("Decline", "Cancel").
//   ghost        Tertiary, low-emphasis.
//   destructive  Solid red - only inside a confirm dialog.
//   destructiveGhost  Red text - destructive entries in row menus/toolbars.
//   ink / onInk / secondary / link  as before.
// Sizes: sm 36, default 44, lg 48; icon 40 and iconLg 44 (touch).
export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds text-body-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ds-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4",
    {
        variants: {
            variant: {
                action: "bg-ds-action font-bold text-ds-action-foreground hover:brightness-95 active:translate-y-px",
                primary: "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90",
                default: "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90",
                ink: "bg-ds-ink text-ds-ink-foreground hover:brightness-110",
                secondary: "bg-ds-secondary text-ds-secondary-foreground hover:bg-ds-secondary/80",
                outline: "border border-ds-input bg-ds-card text-ds-foreground hover:bg-ds-muted",
                onInk: "border border-ds-ink-foreground/30 text-ds-ink-foreground hover:bg-ds-ink-foreground/10",
                ghost: "text-ds-foreground hover:bg-ds-muted",
                destructive: "bg-ds-destructive text-ds-destructive-foreground hover:bg-ds-destructive/90",
                destructiveGhost: "text-ds-destructive hover:bg-ds-danger-subtle",
                link: "h-auto px-0 text-ds-primary underline-offset-4 hover:underline",
            },
            size: {
                sm: "h-9 px-3.5",
                default: "h-11 px-4",
                lg: "h-12 px-6 text-body",
                icon: "size-10",
                iconLg: "size-11",
            },
        },
        compoundVariants: [
            { variant: 'link', size: ['sm', 'default', 'lg'], className: 'h-auto px-0' },
        ],
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
