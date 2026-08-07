import { FaPlus, FaTrash } from 'react-icons/fa';
import {
    SEVERITY_OPTIONS, ISSUE_LABEL_MIN, ISSUE_LABEL_MAX, ISSUE_NOTES_MAX, MAX_DETECTED_ISSUES,
} from '../../utils/inspectionForm';

// Repeatable detected-issue rows (Phase 6.4 Unit 4 / Phase X). Controlled by
// the parent's react-hook-form field array - this component only renders the
// rows and the add/remove controls. Severity is a labeled <select> (never
// color-only), each field is explicitly <label>-associated, and the whole
// group is wrapped in a fieldset/legend for assistive tech.
const DetectedIssuesEditor = ({ fields, register, errors, append, remove }) => {
    const issueErrors = errors?.detectedIssues || [];

    return (
        <fieldset className="fieldset border border-base-300 rounded-lg p-4">
            <legend className="fieldset-legend px-1">Detected issues</legend>

            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg bg-base-200 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">Issue {index + 1}</span>
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="btn btn-ghost btn-xs text-error"
                                    aria-label={`Remove issue ${index + 1}`}>
                                    <FaTrash aria-hidden="true" /> Remove
                                </button>
                            )}
                        </div>

                        <label className="label" htmlFor={`issue-label-${index}`}>Label</label>
                        <input
                            id={`issue-label-${index}`}
                            type="text"
                            className={`input w-full ${issueErrors[index]?.label ? 'input-error' : ''}`}
                            placeholder="e.g. Cracked display panel"
                            aria-invalid={issueErrors[index]?.label ? 'true' : 'false'}
                            {...register(`detectedIssues.${index}.label`, {
                                required: 'Issue label is required.',
                                minLength: { value: ISSUE_LABEL_MIN, message: `At least ${ISSUE_LABEL_MIN} characters.` },
                                maxLength: { value: ISSUE_LABEL_MAX, message: `At most ${ISSUE_LABEL_MAX} characters.` },
                            })}
                        />
                        {issueErrors[index]?.label && <p role="alert" className="text-red-500 text-sm">{issueErrors[index].label.message}</p>}

                        <label className="label" htmlFor={`issue-severity-${index}`}>Severity</label>
                        <select
                            id={`issue-severity-${index}`}
                            defaultValue=""
                            className={`select w-full ${issueErrors[index]?.severity ? 'select-error' : ''}`}
                            aria-invalid={issueErrors[index]?.severity ? 'true' : 'false'}
                            {...register(`detectedIssues.${index}.severity`, { required: 'Select a severity.' })}>
                            <option value="" disabled>Select severity</option>
                            {SEVERITY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {issueErrors[index]?.severity && <p role="alert" className="text-red-500 text-sm">{issueErrors[index].severity.message}</p>}

                        <label className="label" htmlFor={`issue-notes-${index}`}>Notes (optional)</label>
                        <textarea
                            id={`issue-notes-${index}`}
                            className={`textarea w-full ${issueErrors[index]?.notes ? 'textarea-error' : ''}`}
                            rows={2}
                            placeholder="Any extra detail about this issue"
                            {...register(`detectedIssues.${index}.notes`, {
                                maxLength: { value: ISSUE_NOTES_MAX, message: `At most ${ISSUE_NOTES_MAX} characters.` },
                            })}
                        />
                        {issueErrors[index]?.notes && <p role="alert" className="text-red-500 text-sm">{issueErrors[index].notes.message}</p>}
                    </div>
                ))}
            </div>

            {fields.length < MAX_DETECTED_ISSUES && (
                <button
                    type="button"
                    onClick={() => append({ label: '', severity: '', notes: '' })}
                    className="btn btn-outline btn-sm mt-3">
                    <FaPlus aria-hidden="true" /> Add issue
                </button>
            )}
        </fieldset>
    );
};

export default DetectedIssuesEditor;
