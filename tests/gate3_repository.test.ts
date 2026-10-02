import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase server client
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
    
    // Mock product_media query to avoid crashing resolveVariant
    (supabaseServer!.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
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
      glbPath: legacyGlbPath,
      vto_asset_calibrations: vtoData,
    };
    return await repository.resolveVariant(parentProduct, variant);
  };

  it('resolves valid URL when asset is PUBLISHED', async () => {
    const res = await runResolution({
      status: 'PUBLISHED',
      vto_glb_url: '/models/valid.glb'
    });
    expect(res.glbPath).toBe('/models/valid.glb');
  });

  it('fails closed when PUBLISHED but URL is null', async () => {
    const res = await runResolution({
      status: 'PUBLISHED',
      vto_glb_url: null
    });
    expect(res.glbPath).toBeUndefined();
  });

  it('fails closed when PUBLISHED but URL is empty', async () => {
    const res = await runResolution({
      status: 'PUBLISHED',
      vto_glb_url: '   '
    });
    expect(res.glbPath).toBeUndefined();
  });

  it('fails closed when asset is APPROVED (not PUBLISHED)', async () => {
    const res = await runResolution({
      status: 'APPROVED',
      vto_glb_url: '/models/valid.glb'
    });
    expect(res.glbPath).toBeUndefined();
  });

  it('fails closed when asset is REVIEW_REQUIRED', async () => {
    const res = await runResolution({
      status: 'REVIEW_REQUIRED',
      vto_glb_url: '/models/valid.glb'
    });
    expect(res.glbPath).toBeUndefined();
  });

  it('fails closed when vto_asset_id is missing/null (even if legacy glb_path exists)', async () => {
    const res = await runResolution(null, '/models/legacy.glb');
    expect(res.glbPath).toBeUndefined(); // Legacy path is IGNORED
  });
});
