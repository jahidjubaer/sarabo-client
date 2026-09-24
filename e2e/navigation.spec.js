import { test, expect } from './fixtures';

test('an unknown address shows the not-found page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
});

// Signed-out visitors are sent to sign in, for every kind of dashboard page.
for (const path of ['/dashboard', '/dashboard/create-request', '/dashboard/assigned-jobs', '/dashboard/service-catalogue', '/dashboard/reports']) {
    test(`${path} sends a signed-out visitor to sign in`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    });
}

test('the services page lists the catalogue from the API', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByText('Screen replacement').first()).toBeVisible();
    await expect(page.getByText('Battery replacement').first()).toBeVisible();
});
