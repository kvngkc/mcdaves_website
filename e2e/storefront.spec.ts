import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests - Production Checklist', () => {
  
  test('SH-02 / VT-04: Products page redirects to Shop', async ({ page }) => {
    // Navigating to /products should redirect to /shop
    await page.goto('/products');
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('VT-03: VTO Modal handles camera streams cleanly', async ({ page }) => {
    // Navigate to a product page that has VTO
    await page.goto('/shop/classic-cat-eye');
    
    // Click Try-On to open modal
    const tryOnBtn = page.locator('button', { hasText: 'Try On' });
    await expect(tryOnBtn).toBeVisible();
    await tryOnBtn.click();
    
    // Check if camera permission is requested and stream starts
    const videoElem = page.locator('video');
    await expect(videoElem).toBeVisible({ timeout: 10000 });
    
    // Close the modal
    const closeBtn = page.locator('button[aria-label="Close"]');
    await closeBtn.click();
    
    // Ensure video stream is destroyed
    await expect(videoElem).toBeHidden();
  });

  // Additional automated tests for cart, checkout, etc. can be expanded here
});
