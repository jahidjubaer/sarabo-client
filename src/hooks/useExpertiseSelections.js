import { useState } from 'react';

// Selection state for the picker: { [productSlug]: { repairSlugs: string[], experienceYears: string } }.
export function useExpertiseSelections(initial = {}) {
    const [selections, setSelections] = useState(initial);
    const toggleProduct = (slug) => {
        setSelections((prev) => {
            const next = { ...prev };
            if (next[slug]) delete next[slug];
            else next[slug] = { repairSlugs: [], experienceYears: '' };
            return next;
        });
    };
    const toggleRepair = (productSlug, repairSlug) => {
        setSelections((prev) => {
            const current = prev[productSlug] || { repairSlugs: [], experienceYears: '' };
            const has = current.repairSlugs.includes(repairSlug);
            const repairSlugs = has ? current.repairSlugs.filter((s) => s !== repairSlug) : [...current.repairSlugs, repairSlug];
            return { ...prev, [productSlug]: { ...current, repairSlugs } };
        });
    };
    const setYears = (productSlug, value) => {
        setSelections((prev) => {
            const current = prev[productSlug] || { repairSlugs: [], experienceYears: '' };
            return { ...prev, [productSlug]: { ...current, experienceYears: value } };
        });
    };
    return { selections, setSelections, toggleProduct, toggleRepair, setYears };
}
