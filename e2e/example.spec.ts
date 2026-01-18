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
    const payload = JSON.parse(text ?? '{}') as { status?: string };
    expect(payload.status).toBe('ok');
  });

  test('should handle invalid link routes', async ({ page }) => {
    // App routes unknown slugs to the legacy redirect page
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole('heading', { name: 'Invalid Link' })
    ).toBeVisible({ timeout: 5000 });
  });
});
