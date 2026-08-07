import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn-style class combiner: clsx resolves conditional/array class
// inputs, tailwind-merge de-duplicates conflicting Tailwind utilities so a
// caller's override (e.g. a custom `className`) reliably wins over a
// component's defaults. The single helper every design-system primitive uses.
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
