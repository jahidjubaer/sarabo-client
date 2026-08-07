import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
    SEVERITY_OPTIONS, ISSUE_LABEL_MIN, ISSUE_LABEL_MAX, ISSUE_NOTES_MAX, MAX_DETECTED_ISSUES,
} from '../../utils/inspectionForm';

const selectClass = "flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring aria-[invalid=true]:border-ds-destructive";

// Repeatable detected-issue rows (Phase 6.4 Unit 4) redesigned in 7.6A. The
// parent's react-hook-form field array + all validation rules are unchanged;
// this only restyles to the design system. Severity stays a labelled select
// (never colour-only); every field keeps its label association.
const DetectedIssuesEditor = ({ fields, register, errors, append, remove }) => {
    const issueErrors = errors?.detectedIssues || [];

    return (
        <fieldset className="rounded-ds-lg border border-ds-border p-4">
            <legend className="px-1 text-sm font-semibold text-ds-foreground">Detected issues</legend>

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="space-y-2 rounded-ds border border-ds-border bg-ds-muted/30 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-ds-foreground">Issue {index + 1}</span>
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label={`Remove issue ${index + 1}`} className="text-ds-destructive hover:text-ds-destructive">
                                    <Trash2 aria-hidden="true" /> Remove
                                </Button>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor={`issue-label-${index}`}>Label</Label>
                            <Input
                                id={`issue-label-${index}`}
                                type="text"
                                placeholder="e.g. Cracked display panel"
                                aria-invalid={issueErrors[index]?.label ? 'true' : 'false'}
                                {...register(`detectedIssues.${index}.label`, {
                                    required: 'Issue label is required.',
                                    minLength: { value: ISSUE_LABEL_MIN, message: `At least ${ISSUE_LABEL_MIN} characters.` },
                                    maxLength: { value: ISSUE_LABEL_MAX, message: `At most ${ISSUE_LABEL_MAX} characters.` },
                                })}
                            />
                            {issueErrors[index]?.label && <p role="alert" className="text-xs font-medium text-ds-destructive">{issueErrors[index].label.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor={`issue-severity-${index}`}>Severity</Label>
                            <select
                                id={`issue-severity-${index}`}
                                defaultValue=""
                                className={selectClass}
                                aria-invalid={issueErrors[index]?.severity ? 'true' : 'false'}
                                {...register(`detectedIssues.${index}.severity`, { required: 'Select a severity.' })}
                            >
                                <option value="" disabled>Select severity</option>
                                {SEVERITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            {issueErrors[index]?.severity && <p role="alert" className="text-xs font-medium text-ds-destructive">{issueErrors[index].severity.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor={`issue-notes-${index}`}>Notes (optional)</Label>
                            <Textarea
                                id={`issue-notes-${index}`}
                                rows={2}
                                placeholder="Any extra detail about this issue"
                                {...register(`detectedIssues.${index}.notes`, {
                                    maxLength: { value: ISSUE_NOTES_MAX, message: `At most ${ISSUE_NOTES_MAX} characters.` },
                                })}
                            />
                            {issueErrors[index]?.notes && <p role="alert" className="text-xs font-medium text-ds-destructive">{issueErrors[index].notes.message}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {fields.length < MAX_DETECTED_ISSUES && (
                <Button type="button" variant="outline" size="sm" onClick={() => append({ label: '', severity: '', notes: '' })} className="mt-3">
                    <Plus aria-hidden="true" /> Add issue
                </Button>
            )}
        </fieldset>
    );
};

export default DetectedIssuesEditor;
