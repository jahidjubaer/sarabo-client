import { Smartphone, Laptop, Tablet, Tv, Refrigerator, AirVent, WashingMachine, Watch, Headphones, Microwave, Boxes } from 'lucide-react';

// Decorative-only icon lookup for a server-provided product-category slug.
//
// This is NOT a taxonomy. It maps a slug the SERVER already sent to a Lucide
// glyph purely for visual affordance, and falls back to a generic icon for any
// slug it does not recognise - so a new server category always renders safely
// without this client ever inventing, renaming or gating a category of its own.
//
// The entries are copied verbatim from the private map that has lived inside
// components/repair-request/ServiceDefinitionSelector.jsx, so no slug's icon
// changes anywhere. That component deliberately keeps its own copy for now:
// the request form is redesigned in Phase 8, and adopting this module there is
// that phase's edit, not this one's.
//
// `microwave-oven` is the one addition. The live catalogue serves it today and
// neither map covered it, so it fell back to the generic glyph.
const CATEGORY_ICONS = {
    'smartphone': Smartphone,
    'mobile-phone': Smartphone,
    'phone': Smartphone,
    'laptop': Laptop,
    'laptop-computer': Laptop,
    'computer': Laptop,
    'tablet': Tablet,
    'television': Tv,
    'tv': Tv,
    'refrigerator': Refrigerator,
    'fridge': Refrigerator,
    'air-conditioner': AirVent,
    'ac': AirVent,
    'washing-machine': WashingMachine,
    'microwave-oven': Microwave,
    'smartwatch': Watch,
    'watch': Watch,
    'headphones': Headphones,
    'earphones': Headphones,
};

export function getProductCategoryIcon(slug) {
    return CATEGORY_ICONS[slug] || Boxes;
}
