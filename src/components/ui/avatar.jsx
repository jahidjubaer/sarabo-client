import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

// Official shadcn/ui Avatar architecture (on @radix-ui/react-avatar), adapted
// to the `ds-` token scale. AvatarImage falls back to AvatarFallback (initials
// or an icon) when the src is missing or fails to load - never a broken image.

function Avatar({ className, ...props }) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn("relative flex size-9 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    );
}

function AvatarImage({ className, ...props }) {
    return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn("flex size-full items-center justify-center rounded-full bg-ds-muted text-xs font-medium text-ds-muted-foreground", className)}
            {...props}
        />
    );
}

export { Avatar, AvatarImage, AvatarFallback };
