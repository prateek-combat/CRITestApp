import { test, expect } from '@playwright/test';

test.describe('Application E2E Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check if the page has loaded successfully - app title is "Test Platform"
    await expect(page).toHaveTitle(/Test Platform/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('should check health endpoint', async ({ page }) => {
    const response = await page.goto('/api/health');
    expect(response?.status()).toBe(200);

    const text = await page.textContent('body');
    expect(text).toContain('healthy');
  });

  test('should handle non-existent pages', async ({ page }) => {
    // Next.js handles 404s by redirecting to not-found page with 200 status
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(200);

    // Check for 404 content instead of status code
    await expect(page.locator('text=404')).toBeVisible({ timeout: 5000 });
  });
});
