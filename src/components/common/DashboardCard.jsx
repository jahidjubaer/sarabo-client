import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';

// General operational content card with an optional header (title/description/
// actions) and footer. A thin, opinionated composition over the Card
// primitives so most dashboard cards do not re-wire the same header layout.
function DashboardCard({ title, description, actions, footer, children, className, contentClassName }) {
    const hasHeader = title || description || actions;
    return (
        <Card className={className}>
            {hasHeader && (
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                    <div className="min-w-0 space-y-1">
                        {title ? <CardTitle>{title}</CardTitle> : null}
                        {description ? <CardDescription>{description}</CardDescription> : null}
                    </div>
                    {actions ? <div className="shrink-0">{actions}</div> : null}
                </CardHeader>
            )}
            <CardContent className={cn(!hasHeader && "pt-6", contentClassName)}>{children}</CardContent>
            {footer ? <CardFooter>{footer}</CardFooter> : null}
        </Card>
    );
}

export { DashboardCard };
