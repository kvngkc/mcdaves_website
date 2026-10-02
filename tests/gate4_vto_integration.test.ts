import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { configureRepositoryForTestDatabase, getTestSupabaseClient } from './supabase-test-client';

configureRepositoryForTestDatabase();
const supabase = getTestSupabaseClient();

let commerceRepository: typeof import('@/lib/commerce/repository').commerceRepository;

beforeAll(async () => {
  ({ commerceRepository } = await import('@/lib/commerce/repository'));
});

describe('Gate 4 End-to-End VTO Integration', () => {
  const testProductId = 'test-prod-gate4';
  const publishedAssetId = 'vto-g4-published';
  const uncalibratedAssetId = 'vto-g4-uncalib';

  beforeAll(async () => {
    const { error: prodError } = await supabase.from('products').upsert({
      id: testProductId,
      name: 'Gate 4 Test Product',
      slug: 'gate4-test-product',
      description: 'Test product for gate 4',
      default_price: 10000,
      status: 'ACTIVE',
      category: 'unisex',
    });
    if (prodError) throw new Error(`Failed to insert test product: ${prodError.message}`);

    const { error: assetError } = await supabase.from('vto_asset_calibrations').upsert([
      {
        id: '99999999-1111-2222-3333-444444444441',
        asset_id: publishedAssetId,
        name: 'Gate 4 Published Asset',
        status: 'PUBLISHED',
        // Gate 4 publication is intentionally valid without fabricated physical
        // dimensions. The database invariant is the verified derived asset.
        measured_native_width: 1.0,
        width_multiplier: 1.0,
        source_glb_url: '/models/gate4-published.glb',
        vto_glb_url: '/models/gate4-published.glb',
        metadata_source: 'Gate 4 Test',
        derived_storage_path: 'fixtures/gate4-published.glb',
        derived_content_hash: 'gate4-fixture-hash',
        derived_size_bytes: 100,
        output_size_status: 'PASS',
      },
      {
        id: '99999999-1111-2222-3333-444444444442',
        asset_id: uncalibratedAssetId,
        name: 'Gate 4 Uncalibrated Asset',
        status: 'UPLOADED',
        measured_native_width: 1.0,
        width_multiplier: 1.0,
        source_glb_url: '/models/gate4-uncalib.glb',
        vto_glb_url: '/models/gate4-uncalib.glb',
        metadata_source: 'Gate 4 Test',
      },
    ]);
    if (assetError) throw new Error(`Failed to insert test assets: ${assetError.message}`);

    const { error: varError } = await supabase.from('product_variants').upsert([
      {
        id: 'var-g4-published', product_id: testProductId, slug: 'g4-published', name: 'G4 Published',
        sku: 'G4-PUB', color_name: 'Test', color_hex: '#000', vto_asset_id: publishedAssetId, status: 'ACTIVE',
      },
      {
        id: 'var-g4-uncalib', product_id: testProductId, slug: 'g4-uncalib', name: 'G4 Uncalibrated',
        sku: 'G4-UNC', color_name: 'Test2', color_hex: '#111', vto_asset_id: uncalibratedAssetId, status: 'ACTIVE',
      },
      {
        id: 'var-g4-no-vto', product_id: testProductId, slug: 'g4-no-vto', name: 'G4 No VTO',
        sku: 'G4-NO', color_name: 'Test3', color_hex: '#222', vto_asset_id: null,
        glb_path: '/models/fake-legacy-fallback.glb', status: 'ACTIVE',
      },
    ]);
    if (varError) throw new Error(`Failed to insert test variants: ${varError.message}`);
  });

  it('accepts a PUBLISHED VTO asset when Gate 4 verification passes without fabricated dimensions', async () => {
    const { data, error } = await supabase
      .from('vto_asset_calibrations')
      .select('status,frame_width_mm,lens_width_mm,bridge_width_mm,temple_length_mm,bridge_x,bridge_y,bridge_z,derived_storage_path,derived_content_hash,derived_size_bytes,output_size_status')
      .eq('asset_id', publishedAssetId)
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('PUBLISHED');
    expect(data?.frame_width_mm).toBeNull();
    expect(data?.lens_width_mm).toBeNull();
    expect(data?.bridge_width_mm).toBeNull();
    expect(data?.temple_length_mm).toBeNull();
    expect(data?.bridge_x).toBeNull();
    expect(data?.bridge_y).toBeNull();
    expect(data?.bridge_z).toBeNull();
    expect(data?.derived_storage_path).toBe('fixtures/gate4-published.glb');
    expect(data?.derived_content_hash).toBe('gate4-fixture-hash');
    expect(data?.derived_size_bytes).toBe(100);
    expect(data?.output_size_status).toBe('PASS');
  });

  it('correctly maps a PUBLISHED VTO asset to the variant glbPath', async () => {
    const product = await commerceRepository.getProductById(testProductId);
    expect(product).not.toBeNull();
    const publishedVariant = product!.variants.find(v => v.slug === 'g4-published');
    expect(publishedVariant).toBeDefined();
    expect(publishedVariant?.glbPath).toBe('/models/gate4-published.glb');
  });

  it('refuses to map an UNCALIBRATED/UPLOADED VTO asset, preventing Try-On', async () => {
    const product = await commerceRepository.getProductById(testProductId);
    const uncalibVariant = product!.variants.find(v => v.slug === 'g4-uncalib');
    expect(uncalibVariant).toBeDefined();
    expect(uncalibVariant?.glbPath).toBeUndefined();
  });

  it('refuses to use legacy glb_path fallback if vto_asset_id is missing', async () => {
    const product = await commerceRepository.getProductById(testProductId);
    const noVtoVariant = product!.variants.find(v => v.slug === 'g4-no-vto');
    expect(noVtoVariant).toBeDefined();
    expect(noVtoVariant?.glbPath).toBeUndefined();
  });

  afterAll(async () => {
    await supabase.from('product_variants').delete().in('id', ['var-g4-published', 'var-g4-uncalib', 'var-g4-no-vto']);
    await supabase.from('vto_asset_calibrations').delete().in('asset_id', [publishedAssetId, uncalibratedAssetId]);
    await supabase.from('products').delete().eq('id', testProductId);
  });
});
