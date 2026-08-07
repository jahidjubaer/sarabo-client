import { useContext } from 'react';
import { ThemeContext } from './theme-context';

// Access the current theme preference + setter. Must be used under ThemeProvider.
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
