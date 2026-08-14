import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Standard shadcn-style class combiner: clsx resolves conditional/array class
// inputs, tailwind-merge de-duplicates conflicting Tailwind utilities so a
// caller's override (e.g. a custom `className`) reliably wins over a
// component's defaults. The single helper every design-system primitive uses.
//
// ---------------------------------------------------------------------------
// Why tailwind-merge is extended here
// ---------------------------------------------------------------------------
// The Phase 0b type scale adds named ROLES to the `text-*` namespace:
// text-display, text-title, text-heading, text-subhead, text-body,
// text-body-sm, text-micro.
//
// Out of the box tailwind-merge only recognises a `text-*` class as a font
// size when it is a t-shirt size (text-sm, text-2xl) or a length/arbitrary
// value. Our roles are neither, so they fell through to the `text-color`
// group - and any real colour in the same call silently deleted them:
//
//     twMerge('text-body-sm', 'text-ds-foreground')  ->  'text-ds-foreground'
//
// That is a semantic role being destroyed by a colour, and it is invisible:
// no error, no warning, the element just renders at the inherited size. It had
// already cost the navbar its 13.5px links.
//
// Registering the roles in the `font-size` group fixes the classification.
// Literal class parts are matched ahead of validator-based ones, so a role now
// resolves as a size, colours resolve as colours, and both survive together.
// Genuine conflicts still behave normally: two roles collapse to the last one,
// two colours collapse to the last one.
//
// This is the supported extension mechanism for tailwind-merge v3 - no
// internals are patched and no second merging library is introduced.
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [
                {
                    text: [
                        'display',
                        'title',
                        'heading',
                        'subhead',
                        'body',
                        'body-sm',
                        'micro',
                    ],
                },
            ],
        },
    },
});

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
