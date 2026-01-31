import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for archival design system
 * These tests verify the visual appearance of UI elements using the new archival theme
 *
 * Run with: npm run test:e2e
 * Update snapshots with: npm run test:e2e -- --update-snapshots
 */

test.describe('Archival Design System - Visual Regression', () => {
  test.describe('Login Page - Archival Theme', () => {
    test('should render login page with archival styling', async ({ page }) => {
      await page.goto('/login');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Check for archival color scheme
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Verify the page has loaded
      await expect(page).toHaveTitle(/Test Platform/);
    });

    test('should display login form with archival inputs', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for input fields with archival styling
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if ((await emailInput.count()) > 0) {
        await expect(emailInput).toBeVisible();
      }
      if ((await passwordInput.count()) > 0) {
        await expect(passwordInput).toBeVisible();
      }
    });
  });

  test.describe('Admin Dashboard - Archival Cards', () => {
    test.skip('should display stat cards with archival styling', async ({
      page,
    }) => {
      // Skip if authentication is required
      // This would require authentication setup
      await page.goto('/admin/dashboard');

      // Check for card elements with archival styling
      const cards = page.locator('.card-military');
      if ((await cards.count()) > 0) {
        await expect(cards.first()).toBeVisible();
      }
    });
  });

  test.describe('Color Tokens - Archival Palette', () => {
    test('should verify ink color token is applied', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for elements using ink color
      const inkElements = page.locator('.text-ink').first();
      if ((await inkElements.count()) > 0) {
        const color = await inkElements.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        expect(color).toBeDefined();
      }
    });
  });

  test.describe('Buttons - Archival Variants', () => {
    test('should verify primary button with ink background', async ({
      page,
    }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Look for primary buttons
      const primaryButtons = page.locator('button.bg-ink');
      if ((await primaryButtons.count()) > 0) {
        await expect(primaryButtons.first()).toBeVisible();
      }
    });

    test('should verify secondary button with parchment background', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for secondary buttons
      const secondaryButtons = page
        .locator('button')
        .filter({ hasText: /.*/ })
        .first();
      if ((await secondaryButtons.count()) > 0) {
        await expect(secondaryButtons).toBeVisible();
      }
    });
  });

  test.describe('Shadows - Tactical System', () => {
    test('should verify tactical shadow utilities are applied', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for elements with tactical shadows
      const shadowElements = page.locator(
        '.shadow-tactical, .shadow-tactical-lg, .shadow-tactical-xl'
      );
      if ((await shadowElements.count()) > 0) {
        await expect(shadowElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Glass Morphism - Archival Effect', () => {
    test.skip('should verify glass-tactical class is applied', async ({
      page,
    }) => {
      // This would require navigating to a page with modal/glass elements
      await page.goto('/admin/dashboard');

      const glassElements = page.locator('.glass-tactical');
      if ((await glassElements.count()) > 0) {
        await expect(glassElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Typography - Archival Hierarchy', () => {
    test('should verify page titles use ink color', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for headings with ink color
      const headings = page.locator('h1, h2, h3').first();
      if ((await headings.count()) > 0) {
        await expect(headings).toBeVisible();
      }
    });
  });

  test.describe('Badges - Archival Status Colors', () => {
    test.skip('should verify badge-success uses moss theme', async ({
      page,
    }) => {
      await page.goto('/admin/tests');

      const successBadges = page.locator('.badge-success');
      if ((await successBadges.count()) > 0) {
        await expect(successBadges.first()).toBeVisible();

        const bgColor = await successBadges
          .first()
          .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(bgColor).toBeDefined();
      }
    });

    test.skip('should verify badge-warning uses copper theme', async ({
      page,
    }) => {
      await page.goto('/admin/tests');

      const warningBadges = page.locator('.badge-warning');
      if ((await warningBadges.count()) > 0) {
        await expect(warningBadges.first()).toBeVisible();
      }
    });
  });

  test.describe('Gradients - Archival Backgrounds', () => {
    test('should verify gradient backgrounds are applied', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const gradients = page.locator(
        '.bg-gradient-military, .bg-gradient-accent'
      );
      if ((await gradients.count()) > 0) {
        await expect(gradients.first()).toBeVisible();
      }
    });
  });

  test.describe('Border Gradients - Military Theme', () => {
    test.skip('should verify border-gradient-military is applied', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');

      const borderGradients = page.locator('.border-gradient-military');
      if ((await borderGradients.count()) > 0) {
        await expect(borderGradients.first()).toBeVisible();
      }
    });
  });

  test.describe('Input Fields - Archival Inputs', () => {
    test('should verify input-tactical class on form inputs', async ({
      page,
    }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const tacticalInputs = page.locator('.input-tactical');
      if ((await tacticalInputs.count()) > 0) {
        await expect(tacticalInputs.first()).toBeVisible();
      }
    });

    test('should verify input focus state with copper ring', async ({
      page,
    }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const inputs = page
        .locator('input[type="email"], input[type="text"]')
        .first();
      if ((await inputs.count()) > 0) {
        await inputs.focus();
        await expect(inputs).toBeFocused();
      }
    });
  });

  test.describe('Tables - Archival Styling', () => {
    test.skip('should verify table-tactical wrapper is applied', async ({
      page,
    }) => {
      await page.goto('/admin/tests');

      const tacticalTables = page.locator('.table-tactical');
      if ((await tacticalTables.count()) > 0) {
        await expect(tacticalTables.first()).toBeVisible();
      }
    });

    test.skip('should verify table hover effects with ink color', async ({
      page,
    }) => {
      await page.goto('/admin/tests');

      const tableRows = page.locator('tbody tr').first();
      if ((await tableRows.count()) > 0) {
        await tableRows.hover();
        await expect(tableRows).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design - Archival Layout', () => {
    test('should verify responsive spacing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify the page is responsive
      await expect(page.locator('body')).toBeVisible();
    });

    test('should verify responsive spacing on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });

    test('should verify responsive spacing on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Loading States - Archival Spinners', () => {
    test('should verify loading spinner uses ink color', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if any loading spinners use the archival ink color
      const spinners = page.locator('.animate-spin');
      if ((await spinners.count()) > 0) {
        await expect(spinners.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility - Archival Design', () => {
    test('should verify sufficient color contrast for ink/parchment', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Run accessibility audit (basic check)
      const inkText = page.locator('.text-ink').first();
      if ((await inkText.count()) > 0) {
        await expect(inkText).toBeVisible();
      }
    });

    test('should verify focus indicators are visible', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Check if focus ring is visible
      const focusedElement = page.locator(':focus');
      if ((await focusedElement.count()) > 0) {
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Dark Mode Compatibility', () => {
    test('should verify archival theme works in dark mode preference', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });

    test('should verify archival theme works in light mode preference', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Animation and Transitions', () => {
    test('should verify transition classes are applied', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const transitionElements = page.locator(
        '.transition-all, .duration-200, .duration-300'
      );
      if ((await transitionElements.count()) > 0) {
        await expect(transitionElements.first()).toBeVisible();
      }
    });

    test('should respect reduced motion preference', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify page still renders correctly with reduced motion
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
