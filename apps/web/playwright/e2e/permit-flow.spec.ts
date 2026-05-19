import { test, expect } from '@playwright/test';

test.describe('PermitPro — Permit Lifecycle', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Permit management');
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('login page shows magic link form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button', { hasText: /magic link/i })).toBeVisible();
  });

  test('unauthenticated user redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
