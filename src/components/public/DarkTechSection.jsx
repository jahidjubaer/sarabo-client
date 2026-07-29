import React from 'react';
import SectionHeader from './SectionHeader';

// Reusable dark technical-contrast section wrapper for public marketing
// pages only (see Phase 4.1 Unit 1 audit) - dashboard pages stay light and
// do not use this. No animation - motion is out of scope for this unit.
const DarkTechSection = ({ eyebrow, title, description, children, className = '' }) => {
    return (
        <section className={`relative overflow-hidden bg-surface-dark tech-grid-pattern rounded-2xl py-16 px-4 sm:px-6 lg:px-8 ${className}`}>
            {/* rgba below mirrors --color-brand-accent (#38BDF8) - kept literal
                since a radial-gradient stop needs an explicit alpha value. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]"
            />
            <div className="relative max-w-7xl mx-auto">
                {(title || eyebrow) && (
                    <SectionHeader eyebrow={eyebrow} title={title} description={description} variant="dark" />
                )}
                <div className="mt-12 text-on-dark">{children}</div>
            </div>
        </section>
    );
};

export default DarkTechSection;
