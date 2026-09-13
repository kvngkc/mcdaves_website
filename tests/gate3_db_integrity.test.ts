import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uijncyzhguftcdonkcdg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_DmqQyZ1FUv_mY5uTPq8-7Q_HX7mAIvy';

const supabase = createClient(url, serviceKey);

describe('Gate 3 Database Integrity', () => {
  let testAssetId = 'test-asset-gate3';
  let testVariantId = 'test-variant-gate3';
  let testProductId = 'prod-sightly-001'; // Assuming this exists from seed

  beforeAll(async () => {
    // Insert a dummy product to satisfy foreign key constraints
    const { error: prodError } = await supabase.from('products').insert({
      id: testProductId,
      name: 'Gate 3 Test Product',
      slug: 'test-product-gate3',
      description: 'Test product for gate 3',
      default_price: 10000,
      status: 'ACTIVE',
      category: 'unisex',
    });
    if (prodError) console.error("Failed to insert dummy product", prodError);

    // Insert a dummy asset
    const { error: assetError } = await supabase.from('vto_asset_calibrations').insert({
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
    });
    if (assetError) console.error("Failed to insert dummy asset", assetError);
  });

  afterAll(async () => {
    // Cleanup
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
    expect(error?.code).toBe('23503'); // foreign_key_violation
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
    expect(error?.code).toBe('23503'); // foreign_key_violation
  });
});
