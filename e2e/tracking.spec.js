import { test, expect } from './fixtures';

const CODE = 'SRB-e2eTrackingCode01';

test('tracking: an invalid code is refused before any lookup', async ({ page, api }) => {
    await page.goto('/track-request');
    await page.getByRole('textbox').first().fill('!!');
    await page.getByRole('button', { name: /track/i }).first().click();
    await expect(page.getByText('Enter a valid tracking code.')).toBeVisible();
    expect(api.unhandled).toEqual([]);
});

test('tracking: a known code shows the repair and its updates', async ({ page, api }) => {
    const now = new Date().toISOString();
    api.on('GET', `/public/trackings/${CODE}`, {
        json: {
            trackingCode: CODE, currentStatus: 'rider_arriving', createdAt: now, updatedAt: now,
            timeline: [
                { status: 'pending-pickup', timestamp: now },
                { status: 'assignment_pending', timestamp: now },
                { status: 'driver_assigned', timestamp: now },
                { status: 'rider_arriving', timestamp: now },
            ],
        },
    });
    await page.goto('/track-request');
    await page.getByRole('textbox').first().fill(CODE);
    await page.getByRole('button', { name: /track/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/track-request/${CODE}$`));
    await expect(page.getByRole('heading', { name: 'Updates' })).toBeVisible();
});

test('tracking: an unknown code says so', async ({ page, api }) => {
    api.on('GET', `/public/trackings/${CODE}`, { status: 404, json: { message: 'Repair tracking information not found.' } });
    await page.goto(`/track-request/${CODE}`);
    await expect(page.getByText('Tracking code not found')).toBeVisible();
});

test('tracking: a server problem offers a retry', async ({ page }) => {
    // Not faked -> the fixture answers 503.
    await page.goto(`/track-request/${CODE}`);
    await expect(page.getByText('We could not load your repair tracking')).toBeVisible();
    await expect(page.getByRole('button', { name: /try again|retry/i })).toBeVisible();
});
