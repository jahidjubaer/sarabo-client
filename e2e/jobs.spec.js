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
    await expect(page.getByRole('link', { name: 'Sign in to apply' }).first()).toHaveAttribute('href', '/login');
    await expect(list.getByRole('link', { name: 'Sign in to apply' })).toHaveCount(2);
});

test('/jobs filters and sorts the open jobs, and keeps them in the address', async ({ page, api }) => {
    api.on('GET', '/jobs', { status: 200, json: JOBS });
    await page.goto('/jobs');
    const list = page.getByRole('list', { name: 'Open jobs' });
    await expect(list.getByRole('listitem')).toHaveCount(2);
    // On phones the selects sit behind a "Filters" button.
    const more = page.getByRole('button', { name: /^Filters/ });
    if (await more.isVisible()) await more.click();

    await page.getByLabel('Region').selectOption('Chattogram');
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByText('Cumilla, Chattogram')).toBeVisible();
    await expect(page).toHaveURL(/region=Chattogram/);
    await expect(page.getByText('1 of 2 jobs')).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);

    await page.getByRole('button', { name: 'No offers yet' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByText('Cumilla, Chattogram')).toBeVisible();
    await page.getByRole('button', { name: 'No offers yet' }).click();

    await page.getByLabel('Search').fill('samsung');
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByText('Gazipur, Dhaka')).toBeVisible();
    await page.getByLabel('Search').fill('');
    await expect(list.getByRole('listitem')).toHaveCount(2);

    // Highest price first: the laptop (up to 8,000) before the phone (6,000).
    await page.getByLabel('Sort by').selectOption('price-high');
    await expect(list.getByRole('listitem').first()).toContainText('Cumilla, Chattogram');
    await expect(page).toHaveURL(/sort=price-high/);
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
