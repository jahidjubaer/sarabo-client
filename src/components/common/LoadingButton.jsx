import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

// Button with a built-in async/pending pattern: while `loading` it shows a
// spinner, is disabled, and exposes aria-busy so assistive tech announces the
// pending state. Accepts every Button prop (variant/size/type/onClick/...).
function LoadingButton({ loading = false, disabled, loadingText, children, ...props }) {
    return (
        <Button disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
            {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            {loading && loadingText ? loadingText : children}
        </Button>
    );
}

export { LoadingButton };
