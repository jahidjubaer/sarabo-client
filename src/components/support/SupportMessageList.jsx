import { ArrowRight, LoaderCircle, RotateCcw, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { buttonVariants } from '../ui/button-variants';
import { cn } from '../../lib/utils';

function SupportActions({ actions, onNavigate }) {
    if (!actions?.length) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested navigation">
            {actions.map((action) => (
                <Link
                    key={action.id}
                    to={action.to}
                    onClick={onNavigate}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}
                >
                    {action.label}
                    <ArrowRight aria-hidden="true" />
                </Link>
            ))}
        </div>
    );
}

function SupportMessageList({ messages, isPending, error, onRetry, onNavigate }) {
    return (
        <ol className="space-y-5" aria-label="AI support conversation">
            {messages.map((message) => (
                <li key={message.id} className={message.role === 'user' ? 'ml-8 sm:ml-12' : 'mr-4'}>
                    <p className="ds-label mb-1.5 text-ds-muted-foreground">
                        {message.role === 'user' ? 'You' : 'Sarabo AI'}
                    </p>
                    <div
                        className={cn(
                            'break-words text-body-sm whitespace-pre-wrap',
                            message.role === 'user'
                                ? 'rounded-ds-lg border border-ds-border bg-ds-secondary px-4 py-3 text-ds-secondary-foreground'
                                : 'border-l-2 border-ds-primary pl-4 text-ds-foreground'
                        )}
                    >
                        {message.content}
                    </div>
                    {message.role === 'assistant' && (
                        <>
                            <SupportActions actions={message.actions} onNavigate={onNavigate} />
                            {message.escalation?.recommended && (
                                <p className="mt-3 text-body-sm font-medium text-ds-warning">
                                    This issue may require human review.
                                </p>
                            )}
                        </>
                    )}
                </li>
            ))}

            {isPending && (
                <li className="mr-4" role="status">
                    <p className="ds-label mb-1.5 text-ds-muted-foreground">Sarabo AI</p>
                    <div className="flex items-center gap-2 border-l-2 border-ds-primary pl-4 text-body-sm text-ds-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                        Thinking…
                    </div>
                </li>
            )}

            {error && (
                <li>
                    <Alert tone={error.tone || 'warning'}>
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>{error.title}</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                        {(error.canRetry || error.actions?.length > 0) && (
                            <div className="col-start-2 mt-3 flex flex-wrap gap-2">
                                {error.canRetry && (
                                    <Button variant="outline" size="sm" onClick={onRetry}>
                                        <RotateCcw aria-hidden="true" />
                                        Retry
                                    </Button>
                                )}
                                <SupportActions actions={error.actions} onNavigate={onNavigate} />
                            </div>
                        )}
                    </Alert>
                </li>
            )}
        </ol>
    );
}

export default SupportMessageList;
