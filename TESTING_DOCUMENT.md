# McDaves Platform Testing Guide

This guide reflects the current production architecture. The storefront catalogue is sourced from Supabase. Do not create or rely on dummy catalogue records, local GLB fallbacks, or fabricated product values.

## 1. Test environments

### Storefront
- Local: `http://localhost:3000`
- Production: the current Vercel storefront URL

### Admin
- Local: `http://localhost:3001`
- Use the current configured admin authentication. Do not put real credentials in this document.

### Database boundaries
- **Playwright/browser testing:** uses the public Supabase URL and anon key. It must not receive a service-role key.
- **Vitest integration testing:** uses `TEST_SUPABASE_URL` and `TEST_SUPABASE_SERVICE_ROLE_KEY` and must point to a dedicated non-production Supabase project.
- Tests fail closed when the dedicated test database is not configured.
- Never configure `TEST_SUPABASE_URL` to the production project.

## 2. Real product fixture for storefront/VTO testing

For manual Playwright and end-to-end validation, create **one real McDaves product** through the normal product-management workflow.

The fixture should contain:
- Active product with a unique slug
- Real product name, category, collection and price
- Real product images uploaded through product media
- At least one active variant
- Real SKU, colour and inventory quantity
- Actual frame specifications where required by the storefront
- A real VTO asset attached through `vto_asset_id`
- VTO calibration completed with the required measurements
- VTO asset status set to `PUBLISHED`
- A valid `vto_glb_url`

Do not add a fake product merely to make an automated test pass.

## 3. Storefront checks

1. Open `/shop`.
2. Confirm the uploaded active product appears when it has sellable inventory.
3. Confirm the displayed price matches Supabase.
4. Confirm uploaded media loads.
5. Open `/shop/<slug>`.
6. Hard-refresh the page.
7. Open the same URL in a private/incognito window.
8. Confirm an inactive or nonexistent slug does not resolve to another product.
9. Confirm products with incomplete required data are not presented as valid sellable catalogue items.

## 4. VTO checks

VTO availability is fail-closed. A product should expose Try-On only when the selected variant has a published VTO calibration with a valid GLB URL.

Verify:
- Try-On is unavailable when no published VTO exists.
- Try-On becomes available after a real variant is correctly published.
- Camera permission handling works.
- The camera stream stops when the modal closes.
- Head movement maintains frame alignment.
- Left/right rotation does not produce obvious clipping or drift.
- Switching variants selects the correct published asset.
- No `/models/*.glb` local fallback is used.

## 5. Inventory and cart checks

- Only active variants are presented.
- Missing inventory quantities are not converted into fabricated stock.
- A variant with zero available units cannot be purchased.
- Cart price matches the resolved variant price.
- Quantity changes respect available stock.
- Cart state survives navigation and refresh as designed.

## 6. Checkout/payment checks

Use test payment credentials and test customer data only.

Verify:
- Checkout receives the selected variant and actual price.
- Delivery fee rules are correct.
- Paystack is initialized with the expected amount.
- WhatsApp order intent contains the actual product/variant information.
- Payment verification uses the gateway response rather than trusting client-supplied success state.
- Confirmed payment creates the expected order exactly once.

## 7. Vitest integration tests

Run the integration suites only against the dedicated test database:

```bash
TEST_SUPABASE_URL="<dedicated-test-project>" \
TEST_SUPABASE_SERVICE_ROLE_KEY="<test-project-service-role-key>" \
npx vitest run tests/gate3_db_integrity.test.ts tests/gate4_vto_integration.test.ts
```

The test client refuses to run when the required variables are missing or when the test URL matches the configured production URL.

Do not paste credentials into source files, test files, workflow YAML, issues, or documentation.

## 8. Playwright checks

Run:

```bash
npx playwright test ./e2e
```

The browser suite uses public Supabase credentials only. It does not require a service-role key.

The current VTO tests require a real active product/variant fixture. If the fixture is absent, treat that as a test-environment/data problem, not as permission to restore dummy catalogue data.

## 9. Mobile/manual regression

Test at minimum:
- `/shop`
- `/shop/<real-product-slug>`
- Product gallery
- Variant selection
- Add to cart
- Checkout
- VTO modal
- Camera permission flow
- WhatsApp CTA

Use a real phone where possible. Check for horizontal overflow, clipped controls, broken media, and unusable VTO controls.

## 10. Evidence and failure handling

For every failure record:
1. Exact URL or test name
2. Expected behaviour
3. Actual behaviour
4. Browser/device
5. Console/network error if relevant
6. Screenshot or Playwright trace when available
7. Whether the problem is code, database data, environment configuration, or test fixture

Do not fix a failing test by weakening the assertion or reintroducing dummy data. Fix the underlying system or fixture.
