import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Undo2 } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { requestAiDraft, getAiHelperErrorMessage, AI_HELPER_TEXT_MAX_CHARS } from '../../api/aiHelper';
import { FormAlert } from '../common/FormAlert';
import { LoadingButton } from '../common/LoadingButton';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const CONFIDENCE_TEXT = {
    high: 'We filled in the form below.',
    medium: 'We filled in the form below, but please check the repair we picked.',
    low: 'We filled in what we could. Please check the device and repair below.',
};

// "Describe your problem": the customer writes in their own words (Bangla,
// English or Banglish) and the AI fills in the form. Only a suggestion - the
// form stays fully editable, Undo puts back what was there, and prices always
// come from the catalogue, never from the AI.
//
// `onApply(draft)` fills the form and returns what it replaced (or null when
// nothing could be filled); `onUndo(previous)` puts that back.
function AiRequestHelper({ onApply, onUndo }) {
    const axiosSecure = useAxiosSecure();
    const [text, setText] = useState('');
    const [result, setResult] = useState(null); // { alert, previous }

    const mutation = useMutation({
        mutationFn: () => requestAiDraft(axiosSecure, { text }),
        onSuccess: (draft) => {
            const previous = onApply(draft);
            if (!previous) {
                setResult({ alert: { tone: 'warning', title: 'We could not tell what needs fixing', text: draft?.followUpQuestion || 'Please add more detail, like the device and what is wrong, or fill in the form yourself.' }, previous: null });
                return;
            }
            const text = [CONFIDENCE_TEXT[draft.confidence] || CONFIDENCE_TEXT.low, draft.followUpQuestion].filter(Boolean).join(' ');
            setResult({ alert: { tone: 'success', title: 'Form filled in', text }, previous });
        },
        onError: (error) => setResult({ alert: { tone: 'danger', title: 'The AI helper could not help', text: getAiHelperErrorMessage(error) }, previous: null }),
    });

    const trimmedLength = text.trim().length;
    const undo = () => {
        onUndo(result.previous);
        setResult(null);
    };

    return (
        <section aria-labelledby="ai-helper-heading" className="rounded-ds-lg border border-ds-primary/30 bg-ds-primary/5 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ds-primary text-ds-primary-foreground">
                    <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                    <h2 id="ai-helper-heading" className="text-heading text-ds-foreground">Describe your problem <span className="text-body-sm font-normal text-ds-muted-foreground">(optional)</span></h2>
                    <p className="mt-0.5 text-body-sm text-ds-muted-foreground">Tell us in your own words, in Bangla or English, and AI fills in the form for you.</p>
                </div>
            </div>

            <label htmlFor="ai-helper-text" className="sr-only">Describe your problem</label>
            <Textarea
                id="ai-helper-text"
                rows={3}
                value={text}
                maxLength={AI_HELPER_TEXT_MAX_CHARS}
                onChange={(event) => setText(event.target.value)}
                placeholder="e.g. Amar Samsung A52 er screen venge geche, touch kaj kore na"
                aria-describedby="ai-helper-note"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p id="ai-helper-note" className="text-micro text-ds-muted-foreground">
                    Your text is sent to Google Gemini to make the suggestion. Don't include phone numbers or passwords.
                </p>
                <LoadingButton
                    type="button"
                    variant="primary"
                    loading={mutation.isPending}
                    loadingText="Reading…"
                    disabled={trimmedLength < 5}
                    onClick={() => { setResult(null); mutation.mutate(); }}
                    className="shrink-0"
                >
                    <Sparkles aria-hidden="true" /> Fill the form for me
                </LoadingButton>
            </div>

            {result && (
                <div className="mt-4 space-y-2" aria-live="polite">
                    <FormAlert alert={result.alert} />
                    {result.previous && (
                        <Button type="button" variant="ghost" size="sm" onClick={undo}>
                            <Undo2 aria-hidden="true" /> Undo
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}

export default AiRequestHelper;
