import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests - Production Checklist', () => {
  
  test('SH-02 / VT-04: Products page redirects to Shop', async ({ page }) => {
    // Navigating to /products should redirect to /shop
    await page.goto('/products');
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('VT-03: VTO Modal handles camera streams cleanly', async ({ page }) => {
    // Navigate to shop and find a dynamic VTO product
    await page.goto('/shop');
    
    // Find the first product card that has a "Virtual Try-On" button
    const productCard = page.locator('.group').filter({ has: page.locator('button', { hasText: 'Virtual Try-On' }) }).first();
    await expect(productCard).toBeVisible();
    
    // Click the product link to navigate to the product detail page
    await productCard.locator('a').first().click();
    await expect(page).toHaveURL(/.*\/shop\/.+/, { timeout: 30000 });
    // Click Try-On to open modal
    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toBeVisible();
    await tryOnBtn.click();
    
    // Check if camera permission is requested and stream starts
    const videoElem = page.locator('video');
    await expect(videoElem).toBeVisible({ timeout: 10000 });
    
    // Close the modal
    const closeBtn = page.locator('button[aria-label="Close Virtual Try-On"]');
    await closeBtn.click();
    
    // Ensure video stream is destroyed
    await expect(videoElem).toBeHidden();
  });

  // Additional automated tests for cart, checkout, etc. can be expanded here
});
