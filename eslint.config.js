import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-e2e', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['e2e/**', 'playwright.config.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Runs under Node during `vite build`/`vite dev`, not in the browser -
    // needs process/import.meta.dirname-style Node globals, unlike every
    // other file in this project.
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Playwright browser tests run under Node. No React rules: Playwright's
    // fixture callback is named `use`, which the hooks rule would misread.
    files: ['e2e/**/*.js', 'playwright.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
