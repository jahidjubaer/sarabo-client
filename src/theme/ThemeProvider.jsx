import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext, THEME_STORAGE_KEY } from './theme-context';

// Reads the persisted preference defensively - any storage failure falls back
// to 'system' and never breaks rendering.
function readStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
        /* storage unavailable (private mode / blocked) - fall through */
    }
    return 'system';
}

function systemPrefersDark() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Applies (or removes) the `.dark` class on <html>. Only the Phase 7.1 `ds-`
// tokens react to this; DaisyUI keys off its own data-theme, so existing
// business pages are unaffected. Returns the resolved dark boolean.
function applyThemeClass(theme) {
    const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
    }
    return isDark;
}

// App-wide, narrow theme context. The matching inline script in index.html
// applies the persisted theme BEFORE first paint to avoid a flash; this
// provider then keeps the class + storage in sync and reacts to OS changes
// while in 'system' mode.
const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(readStoredTheme);
    const [resolvedDark, setResolvedDark] = useState(() => theme === 'dark' || (theme === 'system' && systemPrefersDark()));

    useEffect(() => {
        setResolvedDark(applyThemeClass(theme));
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system' || typeof window.matchMedia !== 'function') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setResolvedDark(applyThemeClass('system'));
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [theme]);

    const setTheme = useCallback((next) => {
        setThemeState(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            /* storage unavailable - preference stays in-memory for this session */
        }
    }, []);

    const value = useMemo(
        () => ({ theme, setTheme, resolvedTheme: resolvedDark ? 'dark' : 'light' }),
        [theme, setTheme, resolvedDark]
    );

    return <ThemeContext value={value}>{children}</ThemeContext>;
};

export default ThemeProvider;
