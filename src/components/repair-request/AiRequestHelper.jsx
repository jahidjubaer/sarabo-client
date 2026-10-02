import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Sparkles, Undo2, X } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { requestAiDraft, getAiHelperErrorMessage, AI_HELPER_TEXT_MAX_CHARS } from '../../api/aiHelper';
import { checkAiPhoto, shrinkPhotoForAi } from '../../utils/aiPhoto';
import { ALLOWED_DAMAGE_IMAGE_MIME_TYPES } from '../../utils/damageImageValidation';
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
// English or Banglish) and/or adds a photo, and the AI fills in the form. Only
// a suggestion - the form stays fully editable, Undo puts back what was there,
// and prices always come from the catalogue, never from the AI.
//
// `onApply(draft)` fills the form and returns what it replaced (or null when
// nothing could be filled); `onUndo(previous)` puts that back.
// `onPhotoUsed(file | null)` tells the form which photo showed the device, so
// it can be attached to the request once it is created.
function AiRequestHelper({ onApply, onUndo, onPhotoUsed }) {
    const axiosSecure = useAxiosSecure();
    const fileInputRef = useRef(null);
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState(null); // { file, previewUrl }
    const [result, setResult] = useState(null); // { alert, previous }

    useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.previewUrl); }, [photo]);

    const mutation = useMutation({
        mutationFn: async () => requestAiDraft(axiosSecure, {
            text: text.trim(),
            photo: photo ? await shrinkPhotoForAi(photo.file) : undefined,
        }),
        onSuccess: (draft) => {
            const photoShowsDevice = draft?.photo?.showsDevice === true;
            onPhotoUsed?.(photo && photoShowsDevice ? photo.file : null);
            const photoNote = !photo ? null
                : photoShowsDevice ? (draft.photo.finding ? `In the photo: ${draft.photo.finding}` : null)
                    : "The photo doesn't seem to show a device, so we didn't use it.";

            const previous = onApply(draft);
            if (!previous) {
                setResult({
                    alert: {
                        tone: 'warning',
                        title: 'We could not tell what needs fixing',
                        text: [photoNote, draft?.followUpQuestion || 'Please add more detail, like the device and what is wrong, or fill in the form yourself.'].filter(Boolean).join(' '),
                    },
                    previous: null,
                });
                return;
            }
            const message = [
                CONFIDENCE_TEXT[draft.confidence] || CONFIDENCE_TEXT.low,
                photoNote,
                photo && photoShowsDevice ? "We'll add the photo to your request." : null,
                draft.followUpQuestion,
            ].filter(Boolean).join(' ');
            setResult({ alert: { tone: photo && !photoShowsDevice ? 'warning' : 'success', title: 'Form filled in', text: message }, previous });
        },
        onError: (error) => setResult({ alert: { tone: 'danger', title: 'The AI helper could not help', text: getAiHelperErrorMessage(error) }, previous: null }),
    });

    const choosePhoto = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const problem = checkAiPhoto(file);
        if (problem) {
            setResult({ alert: { tone: 'danger', title: "That photo can't be used", text: problem }, previous: null });
            return;
        }
        setResult(null);
        setPhoto({ file, previewUrl: URL.createObjectURL(file) });
    };
    const removePhoto = () => {
        setPhoto(null);
        onPhotoUsed?.(null);
    };
    const undo = () => {
        onUndo(result.previous);
        onPhotoUsed?.(null);
        setResult(null);
    };

    const canAsk = text.trim().length >= 5 || Boolean(photo);

    return (
        <section aria-labelledby="ai-helper-heading" className="rounded-ds-lg border border-ds-primary/30 bg-ds-primary/5 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ds-primary text-ds-primary-foreground">
                    <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                    <h2 id="ai-helper-heading" className="text-heading text-ds-foreground">Describe your problem <span className="text-body-sm font-normal text-ds-muted-foreground">(optional)</span></h2>
                    <p className="mt-0.5 text-body-sm text-ds-muted-foreground">Tell us in your own words, in Bangla or English, or add a photo of the damage. AI fills in the form for you.</p>
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

            <div className="mt-3 flex flex-wrap items-center gap-3">
                {photo ? (
                    <div className="flex items-center gap-2 rounded-ds border border-ds-border bg-ds-card p-1.5 pr-2">
                        <img src={photo.previewUrl} alt="Your photo" className="size-12 rounded object-cover" />
                        <span className="max-w-40 truncate text-body-sm text-ds-foreground">{photo.file.name}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={removePhoto} disabled={mutation.isPending} aria-label="Remove photo">
                            <X aria-hidden="true" />
                        </Button>
                    </div>
                ) : (
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={mutation.isPending}>
                        <Camera aria-hidden="true" /> Add a photo
                    </Button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_DAMAGE_IMAGE_MIME_TYPES.join(',')}
                    className="hidden"
                    onChange={choosePhoto}
                    aria-hidden="true"
                    tabIndex={-1}
                />
                <LoadingButton
                    type="button"
                    variant="primary"
                    loading={mutation.isPending}
                    loadingText={photo ? 'Looking…' : 'Reading…'}
                    disabled={!canAsk}
                    onClick={() => { setResult(null); mutation.mutate(); }}
                    className="sm:ml-auto"
                >
                    <Sparkles aria-hidden="true" /> Fill the form for me
                </LoadingButton>
            </div>
            <p id="ai-helper-note" className="mt-3 text-micro text-ds-muted-foreground">
                Your text and photo are sent to Google Gemini to make the suggestion. Don't include phone numbers, passwords or personal documents.
            </p>

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
