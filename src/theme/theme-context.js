import { createContext } from 'react';

// Narrow UI-only theme context (Phase 7.2). Holds the user's theme preference
// ('light' | 'dark' | 'system') and the resolved concrete theme. Kept in its
// own module so ThemeProvider.jsx exports only a component (fast-refresh rule)
// and useTheme.js can read the context without importing the provider.
export const ThemeContext = createContext(null);

// Namespaced, UI-only storage key - never holds auth/user/business data.
export const THEME_STORAGE_KEY = 'sarabo:theme';

export const THEME_OPTIONS = ['light', 'dark', 'system'];
