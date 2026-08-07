import { cn } from '../../lib/utils';

// Surface primitive: a tonal card that leads with a border + subtle single
// shadow rather than heavy elevation (per the restrained-elevation direction).
function Card({ className, ...props }) {
    return (
        <div
            className={cn("rounded-ds-lg border border-ds-border bg-ds-card text-ds-card-foreground shadow-sm", className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }) {
    return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
    return <h3 className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
    return <p className={cn("text-sm text-ds-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
    return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
