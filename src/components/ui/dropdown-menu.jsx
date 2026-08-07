import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Official shadcn/ui DropdownMenu architecture (on @radix-ui/react-dropdown-menu),
// adapted to the `ds-` token scale. Real Radix menu semantics: roving focus,
// typeahead, Escape/outside-click close, ARIA menu roles. Backs the user menu
// and the theme toggle.

function DropdownMenu(props) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(props) {
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuGroup(props) {
    return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuRadioGroup(props) {
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-50 min-w-[12rem] overflow-hidden rounded-ds-lg border border-ds-border bg-ds-popover p-1 text-ds-popover-foreground shadow-md data-[state=open]:animate-[ds-pop-in_120ms_ease-out] data-[state=closed]:animate-[ds-pop-out_100ms_ease-in]",
                    className
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset ? "" : undefined}
            className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-ds-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "focus:bg-ds-accent focus:text-ds-accent-foreground",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "data-[inset]:pl-8 [&_svg]:size-4 [&_svg]:shrink-0",
                variant === "destructive" && "text-ds-destructive focus:bg-ds-destructive/10 focus:text-ds-destructive",
                className
            )}
            {...props}
        />
    );
}

function DropdownMenuRadioItem({ className, children, ...props }) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-ds-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-ds-accent focus:text-ds-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Circle className="size-2 fill-current" aria-hidden="true" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            checked={checked}
            className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-ds-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-ds-accent focus:text-ds-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="size-4" aria-hidden="true" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuLabel({ className, inset, ...props }) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset ? "" : undefined}
            className={cn("px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8", className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({ className, ...props }) {
    return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-ds-border", className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }) {
    return <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto text-xs tracking-widest text-ds-muted-foreground", className)} {...props} />;
}

export {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
};
