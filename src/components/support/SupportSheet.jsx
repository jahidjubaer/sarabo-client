import { useEffect, useRef } from 'react';
import { Send, ShieldCheck, WifiOff } from 'lucide-react';
import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import SupportMessageList from './SupportMessageList';
import { SUPPORT_MESSAGE_MAX_CHARS } from '../../api/support';

const STARTER_QUESTIONS = Object.freeze([
    'How does the repair process work?',
    'What happens after inspection?',
    'When do I pay for a repair?',
    'What types of devices can Sarabo repair?',
]);

function SupportSheet({
    messages,
    draft,
    error,
    isOnline,
    isPending,
    announcement,
    onDraftChange,
    onSend,
    onRetry,
    onNavigate,
}) {
    const scrollEndRef = useRef(null);
    const showCount = draft.length >= 1200;
    const canSend = isOnline && !isPending && draft.trim().length > 0;

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ block: 'nearest' });
    }, [messages.length, isPending, error]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (canSend) onSend(draft);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend(draft);
        }
    };

    return (
        <SheetContent
            side="right"
            className="h-dvh w-full max-w-none overflow-hidden bg-ds-background sm:max-w-md"
        >
            <SheetHeader className="shrink-0 border-b border-ds-border px-5 pb-4 pt-5 pr-14">
                <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="text-heading">Sarabo AI Support</SheetTitle>
                    <span className="rounded-full border border-ds-primary/25 bg-ds-accent px-2.5 py-1 text-micro font-semibold text-ds-accent-foreground">
                        AI-powered support
                    </span>
                </div>
                <SheetDescription className="max-w-sm text-body-sm">
                    Ask about repairs, quotations, payments, tracking, and using Sarabo.
                </SheetDescription>
            </SheetHeader>

            <div className="shrink-0 border-b border-ds-border bg-ds-muted px-5 py-3">
                <div className="flex items-start gap-2.5 text-body-sm text-ds-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ds-primary" aria-hidden="true" />
                    <p>Do not share passwords, payment-card details, API keys, or tracking codes here.</p>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                {messages.length === 0 && !isPending && !error && (
                    <section aria-labelledby="support-starters-title">
                        <p id="support-starters-title" className="text-subhead text-ds-foreground">
                            What can I help explain?
                        </p>
                        <p className="mt-1 text-body-sm text-ds-muted-foreground">
                            Choose a question or write your own below.
                        </p>
                        <div className="mt-4 grid gap-2">
                            {STARTER_QUESTIONS.map((question) => (
                                <button
                                    key={question}
                                    type="button"
                                    onClick={() => onSend(question)}
                                    disabled={!isOnline || isPending}
                                    className="focus-ring min-h-11 rounded-ds-lg border border-ds-border bg-ds-card px-4 py-3 text-left text-body-sm font-medium text-ds-foreground transition-colors hover:border-ds-primary/50 hover:bg-ds-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {(messages.length > 0 || isPending || error) && (
                    <SupportMessageList
                        messages={messages}
                        isPending={isPending}
                        error={error}
                        onRetry={onRetry}
                        onNavigate={onNavigate}
                    />
                )}
                <div ref={scrollEndRef} aria-hidden="true" />
            </div>

            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
            </div>

            <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-ds-border bg-ds-card px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
                {!isOnline && (
                    <p className="mb-3 flex items-center gap-2 text-body-sm font-medium text-ds-warning" role="status">
                        <WifiOff className="size-4" aria-hidden="true" />
                        You’re offline. Your draft is safe; reconnect to send.
                    </p>
                )}
                <label htmlFor="support-message" className="sr-only">Message Sarabo AI Support</label>
                <div className="flex items-end gap-2">
                    <Textarea
                        id="support-message"
                        value={draft}
                        onChange={(event) => onDraftChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={SUPPORT_MESSAGE_MAX_CHARS}
                        rows={2}
                        disabled={isPending}
                        placeholder="Ask a general support question…"
                        className="max-h-32 min-h-12 resize-none py-3"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        variant="default"
                        disabled={!canSend}
                        aria-label="Send message"
                        className="size-12 shrink-0"
                    >
                        <Send aria-hidden="true" />
                    </Button>
                </div>
                <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-micro text-ds-muted-foreground">
                    <span>Enter to send · Shift + Enter for a new line</span>
                    {showCount && <span>{draft.length}/{SUPPORT_MESSAGE_MAX_CHARS}</span>}
                </div>
            </form>
        </SheetContent>
    );
}

export default SupportSheet;
