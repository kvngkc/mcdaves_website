import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

import { supabaseServer } from '@/lib/supabase/server';
import { CommerceRepository } from '@/lib/commerce/repository';

describe('Gate 3 Repository Resolution (resolveVariant)', () => {
  let repository: any;
  const parentProduct = {
    id: 'prod-test',
    defaultPrice: 100,
    defaultOriginalPrice: 150,
    defaultMaterial: 'Acetate',
    defaultWeight: '20g',
    description: 'Test Product',
    defaultSpecifications: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new (CommerceRepository as any)();
    (supabaseServer.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  const runResolution = async (vtoData: any, legacyGlbPath?: string) => {
    const variant = {
      id: 'var-1',
      priceOverride: undefined,
      originalPriceOverride: undefined,
      materialOverride: undefined,
      weightOverride: undefined,
      descriptionOverride: undefined,
      specificationsOverride: undefined,
      inStock: true,
      unitsInStock: 10,
      stockLevel: 'high',
      vtoAssetId: vtoData?.asset_id,
      glbPath: legacyGlbPath,
      vto_asset_calibrations: vtoData,
    };
    return await repository.resolveVariant(parentProduct, variant);
  };

  it('resolves the authoritative asset identity when asset is PUBLISHED', async () => {
    const res = await runResolution({
      asset_id: 'asset-1',
      status: 'PUBLISHED',
      vto_glb_url: '/models/valid.glb',
    });
    expect(res.vtoAssetId).toBe('asset-1');
  });

  it('fails closed when PUBLISHED but URL is null', async () => {
    const res = await runResolution({
      asset_id: 'asset-1',
      status: 'PUBLISHED',
      vto_glb_url: null,
    });
    expect(res.vtoAssetId).toBeUndefined();
  });

  it('fails closed when PUBLISHED but URL is empty', async () => {
    const res = await runResolution({
      asset_id: 'asset-1',
      status: 'PUBLISHED',
      vto_glb_url: '   ',
    });
    expect(res.vtoAssetId).toBeUndefined();
  });

  it('fails closed when asset is APPROVED (not PUBLISHED)', async () => {
    const res = await runResolution({
      asset_id: 'asset-1',
      status: 'APPROVED',
      vto_glb_url: '/models/valid.glb',
    });
    expect(res.vtoAssetId).toBeUndefined();
  });

  it('fails closed when asset is REVIEW_REQUIRED', async () => {
    const res = await runResolution({
      asset_id: 'asset-1',
      status: 'REVIEW_REQUIRED',
      vto_glb_url: '/models/valid.glb',
    });
    expect(res.vtoAssetId).toBeUndefined();
  });

  it('fails closed when vto_asset_id is missing/null even if legacy glb_path exists', async () => {
    const res = await runResolution(null, '/models/legacy.glb');
    expect(res.vtoAssetId).toBeUndefined();
    expect((res as any).glbPath).toBeUndefined();
  });
});
