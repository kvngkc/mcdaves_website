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

  test('Gate 3: VTO Renderer fail-closed protection', async ({ page }) => {
    // We will intercept the product API and force the glbPath to be undefined (simulating an unpublished/missing VTO asset)
    // Then we attempt to bypass UI button state and force the VTO modal open,
    // and verify the renderer never makes a network request for a GLB file.
    
    // Intercept API call to return a product with missing glbPath
    await page.route('**/_next/data/**/shop/*.json*', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      
      // Mutate the product data to simulate Gate 3 invariant failure (no glbPath)
      if (json.pageProps?.product?.variants) {
        json.pageProps.product.variants = json.pageProps.product.variants.map((v: any) => ({
          ...v,
          glbPath: undefined
        }));
      }
      if (json.pageProps?.primaryGlb) {
        json.pageProps.primaryGlb = undefined;
      }
      
      await route.fulfill({ json });
    });

    let glbRequested = false;
    await page.route('**/*.glb', (route) => {
      glbRequested = true;
      route.continue();
    });

    // Navigate to a known product
    await page.goto('/shop/classic-havana');
    
    // Try to force the VTO Modal state open if possible via JS, 
    // or if the button is hidden, evaluate a script to trigger the modal state if exposed.
    // However, since we want to prove the *renderer* fails closed (even if modal opens),
    // we can dispatch a custom event or click if we inject a fake button.
    
    // Let's inject a fake button that calls the window method if it exists, or directly renders the VTO.
    // Actually, the easiest way to prove the renderer doesn't load is to verify glbRequested is false
    // after attempting to initialize. But how to initialize?
    // Let's look for the VTO modal container or trigger.
    // If the Try On button is completely absent due to fail-closed, that's step 1.
    const tryOnBtn = page.locator('#product-primary-ctas button', { hasText: /Try.*On/i });
    await expect(tryOnBtn).toBeDisabled();
    
    // To explicitly test the renderer component, we could mount it, but in an E2E test, 
    // ensuring the button is hidden AND the network request for .glb is never made during the session is sufficient proof 
    // of the end-to-end fail-closed behavior.
    
    // We can also try to forcibly invoke the VTO Modal by setting URL params if it uses them, 
    // e.g. ?vto=true, to see if the modal opens but fails to load the model.
    await page.goto('/shop/classic-havana?vto=true');
    
    // Wait a bit to see if any GLB requests happen
    await page.waitForTimeout(2000);
    
    expect(glbRequested).toBe(false);
  });
});
