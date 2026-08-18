// src/lib/commerce/storefront-catalog.ts
import { supabase } from '@/lib/supabase/service';
import { Product as StorefrontProduct } from '@/lib/types';
import { products as fallbackSeedProducts } from '@/data/products';

export const dynamic = 'force-dynamic';

export async function getLiveStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    if (!supabase) {
      return fallbackSeedProducts;
    }

    const { data: rawProducts, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (prodErr || !rawProducts || rawProducts.length === 0) {
      return fallbackSeedProducts;
    }

    const { data: rawVariants, error: varErr } = await supabase
      .from('product_variants')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true });

    if (varErr) {
      console.warn('[Storefront] Variant query notice:', varErr);
    }

    const { data: rawMedia } = await supabase
      .from('product_media')
      .select('*')
      .order('sort_order', { ascending: true });

    const liveProducts: StorefrontProduct[] = rawProducts
      .map((p) => {
        const variants = (rawVariants || []).filter((v) => v.product_id === p.id);
        const availableVariants = variants.filter(
          (v) => v.in_stock && (v.units_in_stock === undefined || v.units_in_stock > 0),
        );

        const totalUnits = variants.reduce(
          (sum, v) => sum + (v.units_in_stock ?? (v.in_stock ? 10 : 0)),
          0,
        );

        const colors = variants.map((v) => ({
          name: v.color_name,
          hex: v.color_hex,
          imageSuffix: v.slug,
          inStock: v.in_stock && (v.units_in_stock === undefined || v.units_in_stock > 0),
          unitsInStock: v.units_in_stock ?? (v.in_stock ? 10 : 0),
          glbPath: v.glb_path,
        }));

        const primaryGlb =
          variants.find((v) => v.glb_path)?.glb_path ||
          (p.slug === 'ikoyi-cat-eye'
            ? '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb'
            : '/models/glasses.glb');

        const productMedia = (rawMedia || [])
          .filter((m) => m.product_id === p.id)
          .map((m) => m.url);

        const images =
          productMedia.length > 0
            ? productMedia
            : [
                `/images/products/sightly/${p.slug}/front.webp`,
                `/images/products/sightly/${p.slug}/side.webp`,
                `/images/products/sightly/${p.slug}/lifestyle.webp`,
              ];

        const isAvailable = availableVariants.length > 0 && totalUnits > 0;
        const stockLevel: 'out' | 'low' | 'high' =
          !isAvailable || totalUnits === 0 ? 'out' : totalUnits <= 3 ? 'low' : 'high';

        const hideWhenOutOfStock = p.hide_when_out_of_stock ?? true;

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          collection: 'sightly' as const,
          category: (p.category || 'unisex') as 'men' | 'women' | 'unisex' | 'sunglasses',
          price: Number(p.default_price) || 35000,
          originalPrice: p.default_original_price ? Number(p.default_original_price) : undefined,
          colors: colors.length > 0 ? colors : [{ name: 'Standard', hex: '#000000', imageSuffix: 'default', inStock: true, unitsInStock: 10 }],
          sizes: p.frame_size || '52□18-140',
          material: p.default_material || 'Acetate',
          description: p.description || '',
          features: Array.isArray(p.features) ? p.features : [],
          images,
          inStock: isAvailable,
          stockLevel,
          hideWhenOutOfStock,
          prescriptionRequired: p.prescription_required ?? true,
          tryOnAvailable: p.try_on_available ?? true,
          glbModel: primaryGlb,
          frameSize: p.frame_size || '52□18-140',
          weight: p.default_weight || '22g',
          faceShape: Array.isArray(p.face_shape) ? p.face_shape : ['round', 'oval'],
        };
      })
      // If product has 0 available stock and hideWhenOutOfStock is true, remove it from the live catalog
      .filter((p) => {
        if (!p.inStock && p.hideWhenOutOfStock) {
          return false;
        }
        return true;
      });

    return liveProducts.length > 0 ? liveProducts : fallbackSeedProducts;
  } catch (err) {
    console.error('[Storefront] Error loading live catalog from Supabase:', err);
    return fallbackSeedProducts;
  }
}
