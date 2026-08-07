import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

// Official shadcn/ui Tooltip architecture (on @radix-ui/react-tooltip), adapted
// to the `ds-` token scale. Used to label the collapsed desktop sidebar's
// icon-only nav items. Wrap the app region in TooltipProvider once.

function TooltipProvider({ delayDuration = 200, ...props }) {
    return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip(props) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(props) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({ className, sideOffset = 6, children, ...props }) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-50 overflow-hidden rounded-ds-sm bg-ds-foreground px-2.5 py-1 text-xs font-medium text-ds-background shadow-md data-[state=delayed-open]:animate-[ds-pop-in_120ms_ease-out] data-[state=closed]:animate-[ds-pop-out_100ms_ease-in]",
                    className
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="fill-ds-foreground" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
