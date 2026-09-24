import { test, expect } from './fixtures';

// Every public page loads from a real production build, shows its main
// heading and the right browser-tab title, and throws no JavaScript error.
const PAGES = [
    { path: '/', title: /Electronics repair · Sarabo/ },
    { path: '/services', title: /Services · Sarabo/ },
    { path: '/service-areas', title: /Service areas · Sarabo/ },
    { path: '/about', title: /About · Sarabo/ },
    { path: '/track-request', title: /Track a repair · Sarabo/ },
    { path: '/login', title: /Sign in · Sarabo/ },
    { path: '/register', title: /Create account · Sarabo/ },
];

for (const { path, title } of PAGES) {
    test(`${path} loads with its heading and title`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(title);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    });
}
