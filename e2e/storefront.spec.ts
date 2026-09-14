import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests - Production Checklist', () => {
  test('SH-02 / VT-04: Products page redirects to Shop', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('VT-03: VTO Modal handles camera streams cleanly', async ({ page }) => {
    // Use the isolated test fixture that is known to have a published VTO asset.
    await page.goto('/shop/e2e-vto-glasses');

    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toBeVisible();
    await tryOnBtn.click();

    // CI has no physical camera. Playwright's Chromium process supplies a fake
    // camera device via playwright.config.ts so the real camera lifecycle runs.
    const videoElem = page.locator('video');
    await expect(videoElem).toBeVisible({ timeout: 10000 });

    const closeBtn = page.locator('button[aria-label="Close Virtual Try-On"]');
    await closeBtn.click();
    await expect(videoElem).toBeHidden();
  });

  test('Gate 3: VTO Renderer fail-closed protection', async ({ page }) => {
    let glbRequested = false;
    await page.route('**/*.glb', (route) => {
      glbRequested = true;
      route.continue();
    });

    // This fixture has no VTO asset. Fail-closed means no Try On control is exposed.
    await page.goto('/shop/no-vto-glasses');
    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toHaveCount(0);

    await page.goto('/shop/no-vto-glasses?vto=true');
    await page.waitForTimeout(2000);

    expect(glbRequested).toBe(false);
  });
});
