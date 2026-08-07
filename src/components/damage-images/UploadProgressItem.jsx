import { FaRedo, FaTimes, FaTrash } from 'react-icons/fa';

const STATUS_LABEL = {
    queued: 'Waiting to upload',
    preparing: 'Preparing upload',
    uploading: 'Uploading',
    finalizing: 'Uploaded, finalizing',
    complete: 'Uploaded',
    failed: 'Upload failed',
    cancelled: 'Cancelled',
};

// A local (not-yet-finalized) upload item - separate from a finalized
// DamageImageCard. Uses a native <progress> element (implicit
// progressbar semantics, no manual aria-valuenow needed) for the
// determinate 'uploading' state, and an indeterminate one (no `value`)
// for 'preparing'/'finalizing', so screen readers announce activity
// without a specific (and currently unknown) percentage.
const UploadProgressItem = ({ item, onRetry, onCancel, onRemove }) => {
    const { file, previewUrl, status, progress, errorMessage } = item;
    const isActive = status === 'preparing' || status === 'uploading' || status === 'finalizing';
    const isDeterminate = status === 'uploading';

    return (
        <li className="flex items-center gap-3 rounded-box border border-base-300 p-3">
            <img
                src={previewUrl}
                alt=""
                aria-hidden="true"
                className="w-14 h-14 rounded-box object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs opacity-70" aria-live="polite">
                    {STATUS_LABEL[status] || status}{isDeterminate ? ` - ${progress}%` : ''}
                </p>
                {isActive && (
                    isDeterminate
                        ? <progress className="progress progress-primary w-full mt-1" value={progress} max="100" />
                        : <progress className="progress progress-primary w-full mt-1" />
                )}
                {status === 'failed' && errorMessage && (
                    <p className="text-xs text-error mt-1" role="alert">{errorMessage}</p>
                )}
            </div>
            <div className="flex gap-2 shrink-0">
                {isActive && (
                    <button
                        type="button"
                        onClick={() => onCancel(item.localId)}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label={`Cancel upload of ${file.name}`}
                    >
                        <FaTimes aria-hidden="true" />
                    </button>
                )}
                {(status === 'failed' || status === 'cancelled') && (
                    <button
                        type="button"
                        onClick={() => onRetry(item.localId)}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label={`Retry upload of ${file.name}`}
                    >
                        <FaRedo aria-hidden="true" />
                    </button>
                )}
                {(status === 'failed' || status === 'cancelled') && (
                    <button
                        type="button"
                        onClick={() => onRemove(item.localId)}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label={`Remove ${file.name} from the upload list`}
                    >
                        <FaTrash aria-hidden="true" />
                    </button>
                )}
            </div>
        </li>
    );
};

export default UploadProgressItem;
