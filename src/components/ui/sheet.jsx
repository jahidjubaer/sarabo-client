import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Official shadcn/ui Sheet architecture (on @radix-ui/react-dialog), adapted to
// the `ds-` token scale and local keyframes. Used for mobile dashboard
// navigation - real Radix focus trap + Escape + scroll-lock, sliding from a
// chosen side. Width is capped so it never exceeds the viewport.

function Sheet(props) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[ds-fade-in_200ms_ease-out] data-[state=closed]:animate-[ds-fade-out_200ms_ease-in]",
                className
            )}
            {...props}
        />
    );
}

const SHEET_SIDES = {
    left: "inset-y-0 left-0 h-full border-r data-[state=open]:animate-[ds-slide-in-left_300ms_cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:animate-[ds-slide-out-left_220ms_ease-in]",
    right: "inset-y-0 right-0 h-full border-l data-[state=open]:animate-[ds-slide-in-right_300ms_cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:animate-[ds-slide-out-right_220ms_ease-in]",
};

function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }) {
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                // Phase 13A: see dialog.jsx - every Sheet here is modal (Radix
                // default, overlay present), but role="dialog" was rendered
                // without aria-modal.
                aria-modal="true"
                className={cn(
                    "fixed z-50 flex w-4/5 max-w-xs flex-col gap-0 border-ds-border bg-ds-background text-ds-foreground shadow-xl",
                    SHEET_SIDES[side],
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <SheetPrimitive.Close className="absolute right-4 top-4 rounded-ds-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring">
                        <X className="size-5" aria-hidden="true" />
                        <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                )}
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }) {
    return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 p-4", className)} {...props} />;
}

function SheetFooter({ className, ...props }) {
    return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }) {
    return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-base font-semibold text-ds-foreground", className)} {...props} />;
}

function SheetDescription({ className, ...props }) {
    return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-ds-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
