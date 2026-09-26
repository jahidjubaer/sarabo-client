import { defineConfig, devices } from '@playwright/test';

// Browser tests (e2e/). They run against a real production build that talks
// to a fake API address; every test fakes the API answers it needs and
// nothing leaves the machine (see e2e/fixtures.js). No real Firebase keys or
// accounts are used - the Firebase settings below are placeholders, which is
// enough for signed-out pages.
const PORT = 4173;
const e2eEnv = {
    VITE_API_BASE_URL: 'https://api.e2e.invalid',
    VITE_apiKey: 'e2e-placeholder-api-key',
    VITE_authDomain: 'e2e-placeholder.firebaseapp.com',
    VITE_projectId: 'e2e-placeholder',
    VITE_storageBucket: 'e2e-placeholder.appspot.com',
    VITE_messagingSenderId: '000000000000',
    VITE_appId: '1:000000000000:web:e2eplaceholder',
    VITE_measurementId: '',
    VITE_image_host_key: 'e2e-placeholder',
};

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        // Its own output folder, so it never overwrites a real `dist` build.
        command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort --host 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}`,
        env: e2eEnv,
        timeout: 180 * 1000,
        reuseExistingServer: !process.env.CI,
    },
});
