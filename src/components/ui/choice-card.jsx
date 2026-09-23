import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// A radio (or checkbox) presented as a selectable card, optionally led by a
// photo or an icon - device category, district, service. The real input stays
// in the DOM (visually hidden), so keyboard, form submission and screen
// readers behave exactly like a radio group; the card only styles it.
// Group several with a <fieldset><legend>.
function ChoiceCard({ label, description, image, imageAlt = '', icon: Icon, type = 'radio', className, ...props }) {
    return (
        <label
            className={cn(
                'group relative flex cursor-pointer flex-col overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card transition-colors',
                'hover:border-ds-input',
                'has-[:checked]:border-ds-primary has-[:checked]:ring-1 has-[:checked]:ring-ds-primary',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ds-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ds-background',
                'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
                className
            )}
        >
            <input type={type} className="sr-only" {...props} />
            {image ? <img src={image} alt={imageAlt} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : null}
            <span className="flex items-start gap-3 p-4">
                {Icon && !image ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-ds bg-ds-muted text-ds-foreground">
                        <Icon aria-hidden="true" className="size-5" />
                    </span>
                ) : null}
                <span className="min-w-0 flex-1">
                    <span className="block text-subhead text-ds-foreground">{label}</span>
                    {description ? <span className="mt-0.5 block text-body-sm text-ds-muted-foreground">{description}</span> : null}
                </span>
                <span
                    aria-hidden="true"
                    className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 border-ds-input text-ds-primary-foreground transition-colors',
                        'group-has-[:checked]:border-ds-primary group-has-[:checked]:bg-ds-primary',
                        type === 'radio' ? 'rounded-full' : 'rounded-ds-sm'
                    )}
                >
                    <Check className="size-3 opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
                </span>
            </span>
        </label>
    );
}

export { ChoiceCard };
