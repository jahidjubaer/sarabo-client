import { RotateCcw, X, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

const STATUS_LABEL = {
    queued: 'Waiting to upload',
    preparing: 'Preparing upload',
    uploading: 'Uploading',
    finalizing: 'Uploaded, finalizing',
    complete: 'Uploaded',
    failed: 'Upload failed',
    cancelled: 'Cancelled',
};

// A local (not-yet-finalized) upload item redesigned to the design system
// (Phase 7.6A). Upload-queue behaviour is unchanged - same item shape, same
// retry/cancel/remove callbacks. The determinate bar uses the design-system
// Progress; indeterminate states are announced via aria-live text.
const UploadProgressItem = ({ item, onRetry, onCancel, onRemove }) => {
    const { file, previewUrl, status, progress, errorMessage } = item;
    const isActive = status === 'preparing' || status === 'uploading' || status === 'finalizing';
    const isDeterminate = status === 'uploading';

    return (
        <li className="flex items-center gap-3 rounded-ds-lg border border-ds-border bg-ds-card p-3">
            <img src={previewUrl} alt="" aria-hidden="true" className="size-14 shrink-0 rounded-ds object-cover" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ds-foreground">{file.name}</p>
                <p className="text-xs text-ds-muted-foreground" aria-live="polite">
                    {STATUS_LABEL[status] || status}{isDeterminate ? ` · ${progress}%` : ''}
                </p>
                {isActive && <Progress value={isDeterminate ? progress : 30} className="mt-1.5" />}
                {status === 'failed' && errorMessage && <p className="mt-1 text-xs font-medium text-ds-destructive" role="alert">{errorMessage}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
                {isActive && (
                    <Button variant="ghost" size="icon" onClick={() => onCancel(item.localId)} aria-label={`Cancel upload of ${file.name}`}>
                        <X aria-hidden="true" className="size-4" />
                    </Button>
                )}
                {(status === 'failed' || status === 'cancelled') && (
                    <Button variant="ghost" size="icon" onClick={() => onRetry(item.localId)} aria-label={`Retry upload of ${file.name}`}>
                        <RotateCcw aria-hidden="true" className="size-4" />
                    </Button>
                )}
                {(status === 'failed' || status === 'cancelled') && (
                    <Button variant="ghost" size="icon" onClick={() => onRemove(item.localId)} aria-label={`Remove ${file.name} from the upload list`}>
                        <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                )}
            </div>
        </li>
    );
};

export default UploadProgressItem;
