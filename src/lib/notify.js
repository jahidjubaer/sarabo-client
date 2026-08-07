import { toast } from 'react-toastify';

// Thin, consistent wrapper over react-toastify for non-blocking application
// feedback (Phase 7.1). Intentionally minimal - it standardizes the call sites
// (notify.success/error/warning/info) and exposes promise/dismiss for async
// flows, without building a bespoke notification abstraction. Toast options
// (position/theme/autoClose) are configured once on the single <ToastContainer>
// at the app root (see main.jsx); callers pass only the message and, if needed,
// per-toast overrides.
//
// Division of labour for the redesign: react-toastify = non-blocking feedback;
// Dialog/AlertDialog = new redesigned confirmations; SweetAlert = legacy
// confirmation flows until migrated page-by-page.
const notify = {
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    warning: (message, options) => toast.warning(message, options),
    info: (message, options) => toast.info(message, options),
    message: (message, options) => toast(message, options),
    promise: (promise, messages, options) => toast.promise(promise, messages, options),
    dismiss: (toastId) => toast.dismiss(toastId),
};

export { notify };
