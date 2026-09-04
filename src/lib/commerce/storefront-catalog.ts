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

export async function getLiveResolvedProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  try {
    if (!supabase) return null;

    const { data: p, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (prodErr || !p) return null;

    const { data: rawVariants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', p.id)
      .order('sort_order', { ascending: true });

    const { data: rawMedia } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', p.id)
      .order('sort_order', { ascending: true });

    const media = (rawMedia || []).map((m: Record<string, unknown>, idx: number) => ({
      id: m.id,
      productId: m.product_id,
      variantId: m.variant_id || undefined,
      url: m.url,
      altText: m.alt_text || p.name,
      mediaType: m.type === 'front' ? 'image_front' : m.type === 'side' ? 'image_side' : 'image_lifestyle',
      isPrimary: m.is_primary || (idx === 0),
      sortOrder: m.sort_order || idx,
    }));

    const variants = (rawVariants || []).map((v: Record<string, unknown>, idx: number) => ({
      id: v.id,
      productId: v.product_id,
      slug: v.slug,
      name: v.name,
      sku: v.sku,
      colorName: v.color_name,
      colorHex: v.color_hex,
      priceOverride: v.price_override ? Number(v.price_override) : undefined,
      originalPriceOverride: v.original_price_override ? Number(v.original_price_override) : undefined,
      materialOverride: v.material_override || undefined,
      weightOverride: v.weight_override || undefined,
      specificationsOverride: v.specifications_override || undefined,
      descriptionOverride: v.description_override || undefined,
      glbPath: v.glb_path || undefined,
      inStock: v.in_stock && (v.units_in_stock === undefined || v.units_in_stock > 0),
      stockLevel: !v.in_stock || (v.units_in_stock !== undefined && v.units_in_stock === 0) ? 'out' : (v.units_in_stock ?? 10) <= 3 ? 'low' : 'high',
      unitsInStock: v.units_in_stock ?? 10,
      hideWhenOutOfStock: v.hide_when_out_of_stock ?? false,
      sortOrder: v.sort_order ?? idx,
      status: v.status || 'ACTIVE',
      effectivePrice: v.price_override ? Number(v.price_override) : Number(p.default_price),
      effectiveOriginalPrice: v.original_price_override ? Number(v.original_price_override) : p.default_original_price ? Number(p.default_original_price) : undefined,
      effectiveMaterial: v.material_override || p.default_material || 'Acetate',
      effectiveWeight: v.weight_override || p.default_weight || '22g',
      effectiveSpecifications: {
        frameWidthMm: Number(p.frame_width_mm) || 140,
        lensWidthMm: Number(p.lens_width_mm) || 52,
        bridgeWidthMm: Number(p.bridge_width_mm) || 18,
        templeLengthMm: Number(p.temple_length_mm) || 140,
        frameSize: p.frame_size || '52□18-140',
        ...(v.specifications_override || {}),
      },
      effectiveDescription: v.description_override || p.description || '',
      media: [],
      hasPriceOverride: v.price_override !== undefined,
      hasSpecOverride: v.specifications_override !== undefined,
      createdAt: v.created_at || new Date().toISOString(),
      updatedAt: v.updated_at || new Date().toISOString(),
    }));

    const defaultVariant = variants[0] || {
      id: `default-${p.id}`,
      productId: p.id,
      slug: 'default',
      name: 'Default',
      sku: `${p.id}-DEF`,
      colorName: 'Standard',
      colorHex: '#000000',
      inStock: true,
      stockLevel: 'high',
      unitsInStock: 20,
      hideWhenOutOfStock: false,
      sortOrder: 0,
      status: 'ACTIVE',
      effectivePrice: Number(p.default_price) || 35000,
      effectiveOriginalPrice: p.default_original_price ? Number(p.default_original_price) : undefined,
      effectiveMaterial: p.default_material || 'Acetate',
      effectiveWeight: p.default_weight || '22g',
      effectiveSpecifications: {
        frameWidthMm: Number(p.frame_width_mm) || 140,
        lensWidthMm: Number(p.lens_width_mm) || 52,
        bridgeWidthMm: Number(p.bridge_width_mm) || 18,
        templeLengthMm: Number(p.temple_length_mm) || 140,
        frameSize: p.frame_size || '52□18-140',
      },
      effectiveDescription: p.description || '',
      media,
      hasPriceOverride: false,
      hasSpecOverride: false,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
    };

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      collection: (p.collection || 'sightly') as "sightly" | "premium" | "essentials",
      category: p.category || 'unisex',
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features : [],
      faceShape: Array.isArray(p.face_shape) ? p.face_shape : ['round', 'oval'],
      defaultPrice: Number(p.default_price) || 35000,
      defaultOriginalPrice: p.default_original_price ? Number(p.default_original_price) : undefined,
      defaultMaterial: p.default_material || 'Acetate',
      defaultWeight: p.default_weight || '22g',
      defaultSpecifications: {
        frameWidthMm: Number(p.frame_width_mm) || 140,
        lensWidthMm: Number(p.lens_width_mm) || 52,
        bridgeWidthMm: Number(p.bridge_width_mm) || 18,
        templeLengthMm: Number(p.temple_length_mm) || 140,
        frameSize: p.frame_size || '52□18-140',
      },
      prescriptionRequired: p.prescription_required ?? true,
      tryOnAvailable: p.try_on_available ?? true,
      hideWhenOutOfStock: p.hide_when_out_of_stock ?? false,
      status: p.status || 'ACTIVE',
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
      variants,
      defaultVariant,
      media,
    };
  } catch (err) {
    console.error('[Storefront] Error getting product by slug from Supabase:', err);
    return null;
  }
}
