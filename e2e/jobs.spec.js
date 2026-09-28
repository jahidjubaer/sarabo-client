import { test, expect } from './fixtures';

// The open jobs board (/jobs) is public: a signed-out visitor sees a safe
// summary of open repair requests and is asked to sign in to apply.
const JOBS = {
    jobs: [
        {
            id: 'e2e-job-1', product: { categorySlug: 'smartphone', brand: 'Samsung' }, repairCategorySlug: 'display-screen',
            region: 'Dhaka', district: 'Gazipur', pickupDate: '2099-06-21',
            catalogueEstimate: { min: 1500, max: 6000, currency: 'BDT' },
            postedAt: new Date().toISOString(), reposted: true, offers: 2,
        },
        {
            id: 'e2e-job-2', product: { categorySlug: 'laptop', brand: null }, repairCategorySlug: 'battery-power',
            region: 'Chattogram', district: 'Cumilla', pickupDate: null,
            catalogueEstimate: { min: 2500, max: 8000, currency: 'BDT' },
            postedAt: new Date().toISOString(), reposted: false, offers: 0,
        },
    ],
};

test('/jobs lists open jobs for a signed-out visitor and offers sign-in to apply', async ({ page, api }) => {
    api.on('GET', '/jobs', { status: 200, json: JOBS });
    await page.goto('/jobs');
    await expect(page).toHaveTitle(/Open jobs · Sarabo/);
    await expect(page.getByRole('heading', { level: 1, name: 'Repair jobs waiting for a technician' })).toBeVisible();
    const list = page.getByRole('list', { name: 'Open jobs' });
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(list.getByText('Gazipur, Dhaka')).toBeVisible();
    await expect(list.getByText('Reposted').first()).toBeVisible();
    await expect(list.getByText('2 offers')).toBeVisible();
    await expect(list.getByText('No offers yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to apply' })).toHaveAttribute('href', '/login');
});

test('/jobs shows an empty state when nothing is open', async ({ page, api }) => {
    api.on('GET', '/jobs', { status: 200, json: { jobs: [] } });
    await page.goto('/jobs');
    await expect(page.getByText('No open jobs right now')).toBeVisible();
});

test('/jobs shows an error with retry when the API is down', async ({ page }) => {
    await page.goto('/jobs');
    // React Query retries before giving up.
    await expect(page.getByText("Couldn't load open jobs")).toBeVisible({ timeout: 20000 });
});
