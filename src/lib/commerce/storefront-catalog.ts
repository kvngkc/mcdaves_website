// src/lib/commerce/storefront-catalog.ts
import { supabaseClient } from '@/lib/supabase/client';
import { Product as StorefrontProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';
const VALID_CATEGORIES = new Set(['men', 'women', 'unisex', 'sunglasses']);

export async function getLiveStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    if (!supabaseClient) return [];
    const { data: rawProducts, error: prodErr } = await supabaseClient.from('products').select('*').eq('status', 'ACTIVE').order('created_at', { ascending: false });
    if (prodErr || !rawProducts) {
      console.error('[Storefront] Failed to load products from Supabase:', prodErr);
      return [];
    }
    if (rawProducts.length === 0) return [];

    const { data: rawVariants, error: varErr } = await supabaseClient
      .from('product_variants')
      .select('*, vto_asset_calibrations(asset_id, vto_glb_url, status)')
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true });
    if (varErr) {
      console.error('[Storefront] Failed to load variants from Supabase:', varErr);
      return [];
    }

    const { data: rawMedia, error: mediaErr } = await supabaseClient.from('product_media').select('*').order('sort_order', { ascending: true });
    if (mediaErr) {
      console.error('[Storefront] Failed to load media from Supabase:', mediaErr);
      return [];
    }

    const liveProducts = rawProducts
      .map((p): StorefrontProduct | null => {
        const price = Number(p.default_price);
        const category = typeof p.category === 'string' ? p.category : '';
        if (!p.id || !p.slug || !p.name || !Number.isFinite(price) || price <= 0 || !VALID_CATEGORIES.has(category)) {
          console.warn('[Storefront] Hiding incomplete product record:', p.id);
          return null;
        }

        const variants = (rawVariants || []).filter((v) => v.product_id === p.id);
        const availableVariants = variants.filter((v) => v.in_stock === true && typeof v.units_in_stock === 'number' && v.units_in_stock > 0);
        const totalUnits = variants.reduce((sum, v) => sum + (typeof v.units_in_stock === 'number' ? v.units_in_stock : 0), 0);

        const colors = variants.map((v) => {
          let glbPath: string | undefined;
          const vto = v.vto_asset_calibrations;
          if (vto && vto.status === 'PUBLISHED' && typeof vto.vto_glb_url === 'string' && vto.vto_glb_url.trim() !== '') glbPath = vto.vto_glb_url;
          return {
            name: v.color_name,
            hex: v.color_hex,
            imageSuffix: v.slug,
            inStock: v.in_stock === true && typeof v.units_in_stock === 'number' && v.units_in_stock > 0,
            unitsInStock: typeof v.units_in_stock === 'number' ? v.units_in_stock : 0,
            glbPath,
          };
        });

        const primaryGlb = colors.find((c) => c.glbPath)?.glbPath;
        const images = (rawMedia || []).filter((m) => m.product_id === p.id).map((m) => m.url).filter((url): url is string => typeof url === 'string' && url.trim() !== '');
        const isAvailable = availableVariants.length > 0 && totalUnits > 0;
        const stockLevel: 'out' | 'low' | 'high' = !isAvailable ? 'out' : totalUnits <= 3 ? 'low' : 'high';
        const hideWhenOutOfStock = p.hide_when_out_of_stock ?? true;

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          collection: 'sightly' as const,
          category: category as 'men' | 'women' | 'unisex' | 'sunglasses',
          price,
          originalPrice: p.default_original_price != null ? Number(p.default_original_price) : undefined,
          colors,
          sizes: p.frame_size || '',
          material: p.default_material || '',
          description: p.description || '',
          features: Array.isArray(p.features) ? p.features : [],
          images,
          inStock: isAvailable,
          stockLevel,
          hideWhenOutOfStock,
          prescriptionRequired: p.prescription_required === true,
          tryOnAvailable: Boolean(primaryGlb),
          glbModel: primaryGlb,
          frameSize: p.frame_size || '',
          weight: p.default_weight || '',
          faceShape: Array.isArray(p.face_shape) ? p.face_shape : [],
        };
      })
      .filter((p): p is StorefrontProduct => p !== null)
      .filter((p) => p.inStock || !p.hideWhenOutOfStock);

    return liveProducts;
  } catch (err) {
    console.error('[Storefront] Error loading live catalog from Supabase:', err);
    return [];
  }
}
