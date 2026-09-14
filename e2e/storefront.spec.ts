import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests - Production Checklist', () => {
  test('SH-02 / VT-04: Products page redirects to Shop', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('VT-03: VTO Modal handles camera streams cleanly', async ({ page }) => {
    await page.addInitScript(() => {
      const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices);
      Object.defineProperty(navigator, 'mediaDevices', { value: mediaDevices, configurable: true });
      mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        return canvas.captureStream(30);
      };
    });

    await page.goto('/shop/e2e-vto-glasses');
    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toBeVisible({ timeout: 30000 });
    await expect(tryOnBtn).toBeEnabled();
    await tryOnBtn.click();

    const videoElem = page.locator('video');
    await expect(videoElem).toBeVisible({ timeout: 15000 });

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

    await page.goto('/shop/no-vto-glasses');
    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toBeDisabled();

    await page.goto('/shop/no-vto-glasses?vto=true');
    await page.waitForTimeout(2000);
    expect(glbRequested).toBe(false);
  });
});
