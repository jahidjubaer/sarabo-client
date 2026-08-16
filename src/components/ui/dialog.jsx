import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Official shadcn/ui Dialog architecture (on @radix-ui/react-dialog), adapted
// to the Phase 7.1 `ds-` token scale and the local Radix keyframes in
// index.css. Provides real Radix focus trapping, Escape handling, and
// scroll-lock - not a hand-rolled substitute. Backs the CommandDialog.

function Dialog(props) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[ds-fade-in_150ms_ease-out] data-[state=closed]:animate-[ds-fade-out_150ms_ease-in]",
                className
            )}
            {...props}
        />
    );
}

function DialogContent({ className, children, showCloseButton = true, ...props }) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                // Phase 13A: this rendered role="dialog" with no aria-modal, even
                // though every Dialog here is modal (Radix's default - nothing in
                // this app passes modal={false}, and the overlay makes the
                // background inert). Screen readers use aria-modal to confine
                // reading to the dialog; without it some pairs happily read the
                // page behind. A caller can still override it via props.
                aria-modal="true"
                className={cn(
                    "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-ds-lg border border-ds-border bg-ds-popover p-6 text-ds-popover-foreground shadow-lg data-[state=open]:animate-[ds-pop-in_150ms_ease-out] data-[state=closed]:animate-[ds-pop-out_120ms_ease-in]",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-ds-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring">
                        <X className="size-4" aria-hidden="true" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }) {
    return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
    return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
    return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg font-semibold leading-none", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
    return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-ds-muted-foreground", className)} {...props} />;
}

export {
    Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay,
    DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};
