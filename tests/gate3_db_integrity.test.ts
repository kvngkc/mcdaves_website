import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabaseClient } from './supabase-test-client';

const supabase = getTestSupabaseClient();

describe('Gate 3 Database Integrity', () => {
  const testAssetId = 'test-asset-gate3';
  const testVariantId = 'test-variant-gate3';
  const testProductId = 'test-prod-gate3';

  beforeAll(async () => {
    // Idempotent seeding: clear any fixture rows a previous (possibly
    // interrupted) run may have left behind, then upsert. This keeps the suite
    // re-runnable and safe against a stale row without weakening any assertion.
    await supabase.from('product_variants').delete().eq('id', testVariantId);
    await supabase.from('vto_asset_calibrations').delete().eq('asset_id', testAssetId);
    await supabase.from('products').delete().eq('id', testProductId);

    const { error: prodError } = await supabase.from('products').upsert({
      id: testProductId,
      name: 'Gate 3 Test Product',
      slug: 'test-product-gate3',
      description: 'Test product for gate 3',
      default_price: 10000,
      status: 'ACTIVE',
      category: 'unisex',
    });
    if (prodError) throw new Error(`Failed to insert test product: ${prodError.message}`);

    const { error: assetError } = await supabase.from('vto_asset_calibrations').upsert({
      id: '11111111-2222-3333-4444-555555555555',
      asset_id: testAssetId,
      name: 'Gate 3 Test Asset',
      status: 'PUBLISHED',
      frame_width_mm: 140,
      lens_width_mm: 50,
      bridge_width_mm: 20,
      temple_length_mm: 140,
      bridge_x: 0,
      bridge_y: 0,
      bridge_z: 0,
      measured_native_width: 1,
      width_multiplier: 1,
      source_glb_url: '/models/test.glb',
      vto_glb_url: '/models/test.glb',
      metadata_source: 'Test',
      derived_storage_path: 'fixtures/gate3.glb',
      derived_content_hash: 'gate3-fixture-hash',
      derived_size_bytes: 100,
      output_size_status: 'PASS',
    });
    if (assetError) throw new Error(`Failed to insert test asset: ${assetError.message}`);
  });

  afterAll(async () => {
    await supabase.from('product_variants').delete().eq('id', testVariantId);
    await supabase.from('vto_asset_calibrations').delete().eq('asset_id', testAssetId);
    await supabase.from('products').delete().eq('id', testProductId);
  });

  it('rejects INSERT with invalid vto_asset_id', async () => {
    const { error } = await supabase.from('product_variants').insert({
      id: testVariantId,
      product_id: testProductId,
      slug: 'test',
      name: 'Test',
      sku: 'TEST-001',
      color_name: 'Test',
      color_hex: '#000000',
      vto_asset_id: 'non-existent-asset-id',
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');
  });

  it('allows INSERT with valid vto_asset_id', async () => {
    const { error } = await supabase.from('product_variants').insert({
      id: testVariantId,
      product_id: testProductId,
      slug: 'test2',
      name: 'Test2',
      sku: 'TEST-002',
      color_name: 'Test',
      color_hex: '#000000',
      vto_asset_id: testAssetId,
    });
    expect(error).toBeNull();
  });

  it('rejects DELETE of vto_asset_calibrations when referenced by a variant (RESTRICT)', async () => {
    const { error } = await supabase.from('vto_asset_calibrations').delete().eq('asset_id', testAssetId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');
  });
});
