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

// Searching a covered sub-area goes to that area, not just its district.
test('service areas: searching "Ambarkhana" zooms to Ambarkhana in Sylhet', async ({ page }) => {
    await page.goto('/service-areas');
    await page.getByRole('combobox', { name: /search a district/i }).fill('Ambarkhana');
    await page.getByRole('option', { name: /Ambarkhana\s*Sylhet/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Ambarkhana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ambarkhana', pressed: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map showing Ambarkhana in Sylhet service area' })).toBeVisible();

    // Another chip in the panel moves the map to that area.
    await page.getByRole('button', { name: 'Zindabazar' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Zindabazar' })).toBeVisible();
});

test('service areas: a district name still opens the district', async ({ page }) => {
    await page.goto('/service-areas?q=Sylhet');
    await expect(page.getByRole('heading', { level: 2, name: 'Sylhet' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map showing the Sylhet service area' })).toBeVisible();
});
