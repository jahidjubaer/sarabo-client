import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';

// Official shadcn/ui Command architecture (on cmdk), adapted to the `ds-` token
// scale. CommandDialog wraps it in the Dialog primitive above (real focus trap
// + Escape). In Phase 7.2 this is a client-side NAVIGATION palette only - it
// filters a fixed list of dashboard destinations; it performs no backend or
// entity search.

function Command({ className, ...props }) {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn("flex h-full w-full flex-col overflow-hidden rounded-ds-lg bg-ds-popover text-ds-popover-foreground", className)}
            {...props}
        />
    );
}

function CommandDialog({ title = "Command Menu", description = "Search dashboard destinations", children, className, ...props }) {
    return (
        <Dialog {...props}>
            <DialogContent showCloseButton={false} className={cn("overflow-hidden p-0", className)}>
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ds-muted-foreground [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
}

function CommandInput({ className, ...props }) {
    return (
        <div className="flex items-center gap-2 border-b border-ds-border px-3" cmdk-input-wrapper="">
            <Search className="size-4 shrink-0 text-ds-muted-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
                data-slot="command-input"
                className={cn("flex h-11 w-full bg-transparent py-3 text-sm text-ds-foreground outline-none placeholder:text-ds-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
                {...props}
            />
        </div>
    );
}

function CommandList({ className, ...props }) {
    return <CommandPrimitive.List data-slot="command-list" className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-1", className)} {...props} />;
}

function CommandEmpty(props) {
    return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm text-ds-muted-foreground" {...props} />;
}

function CommandGroup({ className, ...props }) {
    return <CommandPrimitive.Group data-slot="command-group" className={cn("overflow-hidden p-1 text-ds-foreground", className)} {...props} />;
}

function CommandItem({ className, ...props }) {
    return (
        <CommandPrimitive.Item
            data-slot="command-item"
            className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-ds-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-ds-accent data-[selected=true]:text-ds-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ds-muted-foreground",
                className
            )}
            {...props}
        />
    );
}

function CommandSeparator({ className, ...props }) {
    return <CommandPrimitive.Separator data-slot="command-separator" className={cn("-mx-1 my-1 h-px bg-ds-border", className)} {...props} />;
}

function CommandShortcut({ className, ...props }) {
    return <span data-slot="command-shortcut" className={cn("ml-auto text-xs tracking-widest text-ds-muted-foreground", className)} {...props} />;
}

export {
    Command, CommandDialog, CommandInput, CommandList, CommandEmpty,
    CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
};
