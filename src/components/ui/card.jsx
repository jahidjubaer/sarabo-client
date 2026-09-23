import { cn } from '../../lib/utils';

// Surface primitive: a bordered card with no shadow. Elevation is reserved for
// menus, dialogs, sheets and the mobile action bar.
function Card({ className, ...props }) {
    return (
        <div
            className={cn("rounded-ds-lg border border-ds-border bg-ds-card text-ds-card-foreground", className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }) {
    return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
    return <h3 className={cn("text-subhead", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
    return <p className={cn("text-body-sm text-ds-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
    return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
