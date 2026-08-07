import { cva } from 'class-variance-authority';

// Kept in its own module (not button.jsx) so the component file only exports a
// component - satisfies eslint-plugin-react-refresh's fast-refresh boundary
// rule. Import `buttonVariants` here to style a non-<button> element (e.g. a
// router Link) as a button.
export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ds-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4",
    {
        variants: {
            variant: {
                default: "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90",
                secondary: "bg-ds-secondary text-ds-secondary-foreground hover:bg-ds-secondary/80",
                outline: "border border-ds-input bg-ds-background text-ds-foreground hover:bg-ds-accent hover:text-ds-accent-foreground",
                ghost: "text-ds-foreground hover:bg-ds-accent hover:text-ds-accent-foreground",
                destructive: "bg-ds-destructive text-ds-destructive-foreground hover:bg-ds-destructive/90",
                link: "text-ds-primary underline-offset-4 hover:underline",
            },
            size: {
                sm: "h-8 rounded-ds-sm px-3 text-xs",
                default: "h-10 px-4 py-2",
                lg: "h-11 rounded-ds-lg px-6 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
