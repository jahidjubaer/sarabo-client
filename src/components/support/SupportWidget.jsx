import { useEffect, useRef, useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { Sheet, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import SupportSheet from './SupportSheet';
import { useSupportChat } from '../../hooks/useSupportChat';
import { SUPPORT_HISTORY_MAX_MESSAGES } from '../../api/support';
import { resolveSupportActions, SUPPORT_ACTIONS } from '../../utils/supportActions';

let messageId = 0;
function nextMessageId(role) {
    messageId += 1;
    return `${role}-${Date.now()}-${messageId}`;
}

function buildHistory(messages) {
    return messages
        .filter((message) => message.committed)
        .map(({ role, content }) => ({ role, content }))
        .slice(-SUPPORT_HISTORY_MAX_MESSAGES);
}

function retryDelayMessage(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    if (seconds < 60) return ` Try again in about ${Math.ceil(seconds)} seconds.`;
    return ` Try again in about ${Math.ceil(seconds / 60)} minutes.`;
}

function normalizeSupportError(error) {
    const status = error?.response?.status;
    const body = error?.response?.data;
    const requestTimedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
    const code = error?.supportCode
        || body?.code
        || (status === 401 ? 'AUTH_EXPIRED' : null)
        || (requestTimedOut ? 'SUPPORT_TIMEOUT' : 'NETWORK_ERROR');
    const serverMessage = typeof body?.message === 'string' ? body.message : '';
    const sensitive = code === 'SUPPORT_VALIDATION_ERROR'
        && serverMessage.startsWith('Do not send passwords');

    switch (code) {
        case 'SUPPORT_VALIDATION_ERROR':
            return {
                code,
                title: sensitive ? 'Keep sensitive details out of chat' : 'Review your message',
                message: sensitive
                    ? serverMessage
                    : 'The message could not be sent. Review it and try again.',
                tone: 'warning',
                sensitive,
                canRetry: false,
            };
        case 'SUPPORT_RATE_LIMITED':
            return {
                code,
                title: 'Please wait before sending again',
                message: `You’ve sent several support requests recently.${retryDelayMessage(body?.retryAfterSeconds)}`,
                tone: 'warning',
                canRetry: false,
            };
        case 'SUPPORT_UNAVAILABLE':
            return {
                code,
                title: 'Sarabo AI is unavailable right now',
                message: 'Please try again in a moment. You can still browse services or track a repair.',
                tone: 'info',
                canRetry: true,
                actions: [SUPPORT_ACTIONS.VIEW_SERVICES, SUPPORT_ACTIONS.TRACK_REQUEST],
            };
        case 'SUPPORT_TIMEOUT':
            return {
                code,
                title: 'The response took too long',
                message: 'AI support took too long to respond. Please try again.',
                tone: 'warning',
                canRetry: true,
            };
        case 'SUPPORT_INVALID_RESPONSE':
            return {
                code,
                title: 'The response could not be used',
                message: 'AI support could not produce a usable response. Please try again.',
                tone: 'warning',
                canRetry: true,
            };
        case 'AUTH_EXPIRED':
            return {
                code,
                title: 'Your session has expired',
                message: 'Log in again before continuing with authenticated support.',
                tone: 'warning',
                canRetry: false,
                actions: [SUPPORT_ACTIONS.LOGIN],
            };
        default:
            return {
                code: 'NETWORK_ERROR',
                title: navigator.onLine ? 'Could not reach AI support' : 'You’re offline',
                message: navigator.onLine
                    ? 'Check your connection and try again.'
                    : 'Reconnect, then retry when you’re ready.',
                tone: 'warning',
                canRetry: true,
            };
    }
}

function SupportWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState(null);
    const [failedRequest, setFailedRequest] = useState(null);
    const [announcement, setAnnouncement] = useState('');
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const inFlightRef = useRef(false);
    const supportMutation = useSupportChat();

    useEffect(() => {
        const markOnline = () => setIsOnline(true);
        const markOffline = () => setIsOnline(false);
        window.addEventListener('online', markOnline);
        window.addEventListener('offline', markOffline);
        return () => {
            window.removeEventListener('online', markOnline);
            window.removeEventListener('offline', markOffline);
        };
    }, []);

    const runRequest = async ({ message, history, userMessageId }) => {
        if (inFlightRef.current || !navigator.onLine) return;
        inFlightRef.current = true;
        setError(null);
        setAnnouncement('');

        try {
            const response = await supportMutation.mutateAsync({ message, history });
            if (typeof response?.reply !== 'string' || response.reply.trim().length === 0) {
                throw Object.assign(new Error('invalid support response'), {
                    supportCode: 'SUPPORT_INVALID_RESPONSE',
                });
            }
            const assistantMessage = {
                id: nextMessageId('assistant'),
                role: 'assistant',
                content: response.reply.trim(),
                actions: resolveSupportActions(response.actions),
                escalation: response.escalation?.recommended === true
                    ? { recommended: true }
                    : { recommended: false },
                committed: true,
            };
            setMessages((current) => [
                ...current.map((entry) => (
                    entry.id === userMessageId ? { ...entry, committed: true } : entry
                )),
                assistantMessage,
            ]);
            setFailedRequest(null);
            setAnnouncement(`Sarabo AI replied: ${assistantMessage.content}`);
        } catch (requestError) {
            const normalized = normalizeSupportError(requestError);
            setError(normalized);
            if (normalized.code === 'SUPPORT_VALIDATION_ERROR') {
                setMessages((current) => current.filter((entry) => entry.id !== userMessageId));
                setDraft(normalized.sensitive ? '' : message);
                setFailedRequest(null);
            } else {
                setFailedRequest({ message, history, userMessageId });
            }
        } finally {
            inFlightRef.current = false;
        }
    };

    const sendMessage = (value) => {
        const message = value.trim();
        if (!message || inFlightRef.current || supportMutation.isPending || !navigator.onLine) return;
        const history = buildHistory(messages);
        const userMessage = {
            id: nextMessageId('user'),
            role: 'user',
            content: message,
            committed: false,
        };
        setMessages((current) => [...current.filter((entry) => entry.committed), userMessage]);
        setFailedRequest(null);
        setDraft('');
        runRequest({ message, history, userMessageId: userMessage.id });
    };

    const retryMessage = () => {
        if (!failedRequest || inFlightRef.current || supportMutation.isPending || !navigator.onLine) return;
        runRequest(failedRequest);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ink"
                    size="lg"
                    className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 h-12 rounded-full px-4 shadow-lg sm:right-6 sm:bottom-6"
                    aria-label="Open Sarabo AI Support"
                >
                    <MessageCircleQuestion aria-hidden="true" />
                    Ask Sarabo
                </Button>
            </SheetTrigger>
            <SupportSheet
                messages={messages}
                draft={draft}
                error={error}
                isOnline={isOnline}
                isPending={supportMutation.isPending}
                announcement={announcement}
                onDraftChange={setDraft}
                onSend={sendMessage}
                onRetry={retryMessage}
                onNavigate={() => setOpen(false)}
            />
        </Sheet>
    );
}

export default SupportWidget;
