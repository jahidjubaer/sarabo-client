import { test, expect } from './fixtures';

// Form checks run in the browser before anything is sent, so these never
// reach Firebase.
test('sign in: empty fields are flagged', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
});

test('sign in: a short password is flagged', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('someone@example.com');
    await page.getByLabel('Password').fill('12345');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Password must be 6 characters or longer.')).toBeVisible();
});

test('create account: required fields are flagged', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByText('Name is required.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
});

test('create account: a weak password is flagged', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Password').fill('weakpassword');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByText(/Password must have at least one uppercase/)).toBeVisible();
});
