import { useEffect } from 'react';
import { cn } from '../../lib/utils';

// A sticky bar for a page's one primary action on phones and tablets (below
// lg). It sits directly above the dashboard's bottom tab bar when that is
// present, and while mounted sets `.has-actionbar` on <html>, which lifts
// floating UI (the support button) above both - see styles/base.css.
// Desktop layouts show the action in place instead.
function MobileActionBar({ children, className }) {
    useEffect(() => {
        document.documentElement.classList.add('has-actionbar');
        return () => document.documentElement.classList.remove('has-actionbar');
    }, []);

    return (
        <div
            className={cn(
                'fixed inset-x-0 z-30 border-t border-ds-border bg-ds-card/95 px-4 py-3 shadow-[0_-12px_24px_-16px_rgb(6_13_16/0.35)] backdrop-blur supports-[backdrop-filter]:bg-ds-card/90 lg:hidden',
                'bottom-[var(--tabbar-offset,0px)]',
                className
            )}
        >
            <div className="mx-auto flex max-w-2xl items-center gap-3">{children}</div>
        </div>
    );
}

export { MobileActionBar };
