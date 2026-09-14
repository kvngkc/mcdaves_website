// src/lib/commerce/storefront-catalog.ts
import { supabaseClient } from '@/lib/supabase/client';
import { Product as StorefrontProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set(['men', 'women', 'unisex', 'sunglasses']);

export async function getLiveStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    if (!supabaseClient) return [];

    const { data: rawProducts, error: prodErr } = await supabaseClient
      .from('products')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

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

    const { data: rawMedia, error: mediaErr } = await supabaseClient
      .from('product_media')
      .select('*')
      .order('sort_order', { ascending: true });

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
        const availableVariants = variants.filter(
          (v) => v.in_stock === true && typeof v.units_in_stock === 'number' && v.units_in_stock > 0,
        );

        const totalUnits = variants.reduce(
          (sum, v) => sum + (typeof v.units_in_stock === 'number' ? v.units_in_stock : 0),
          0,
        );

        const colors = variants.map((v) => {
          let glbPath: string | undefined;
          const vto = v.vto_asset_calibrations;
          if (vto && vto.status === 'PUBLISHED' && typeof vto.vto_glb_url === 'string' && vto.vto_glb_url.trim() !== '') {
            glbPath = vto.vto_glb_url;
          }

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
        const images = (rawMedia || [])
          .filter((m) => m.product_id === p.id)
          .map((m) => m.url)
          .filter((url): url is string => typeof url === 'string' && url.trim() !== '');

        const isAvailable = availableVariants.length > 0 && totalUnits > 0;
        const stockLevel: 'out' | 'low' | 'high' =
          !isAvailable ? 'out' : totalUnits <= 3 ? 'low' : 'high';

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

export async function getLiveResolvedProductBySlug(slug: string): Promise<any | null> {
  try {
    if (!supabaseClient) return null;

    const { data: p, error: prodErr } = await supabaseClient
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .single();

    if (prodErr || !p) return null;

    const defaultPrice = Number(p.default_price);
    const dimensions = {
      frameWidthMm: Number(p.frame_width_mm),
      lensWidthMm: Number(p.lens_width_mm),
      bridgeWidthMm: Number(p.bridge_width_mm),
      templeLengthMm: Number(p.temple_length_mm),
    };

    if (!Number.isFinite(defaultPrice) || defaultPrice <= 0 || !Object.values(dimensions).every((value) => Number.isFinite(value) && value > 0)) {
      console.warn('[Storefront] Hiding incomplete product detail record:', p.id);
      return null;
    }

    const { data: rawVariants, error: varErr } = await supabaseClient
      .from('product_variants')
      .select('*, vto_asset_calibrations(asset_id, vto_glb_url, status)')
      .eq('product_id', p.id)
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true });

    if (varErr) return null;

    const { data: rawMedia, error: mediaErr } = await supabaseClient
      .from('product_media')
      .select('*')
      .eq('product_id', p.id)
      .order('sort_order', { ascending: true });

    if (mediaErr) return null;

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

    const variants = (rawVariants || []).map((v: Record<string, unknown>, idx: number) => {
      let glbPath: string | undefined;
      const vto = v.vto_asset_calibrations as any;
      if (vto && vto.status === 'PUBLISHED' && typeof vto.vto_glb_url === 'string' && vto.vto_glb_url.trim() !== '') {
        glbPath = vto.vto_glb_url;
      }

      const unitsInStock = typeof v.units_in_stock === 'number' ? v.units_in_stock : 0;
      const inStock = v.in_stock === true && unitsInStock > 0;
      const priceOverride = v.price_override != null ? Number(v.price_override) : undefined;
      const effectivePrice = priceOverride ?? defaultPrice;

      return {
        id: v.id,
        productId: v.product_id,
        slug: v.slug,
        name: v.name,
        sku: v.sku,
        colorName: v.color_name,
        colorHex: v.color_hex,
        priceOverride,
        originalPriceOverride: v.original_price_override != null ? Number(v.original_price_override) : undefined,
        materialOverride: v.material_override || undefined,
        weightOverride: v.weight_override || undefined,
        specificationsOverride: v.specifications_override || undefined,
        descriptionOverride: v.description_override || undefined,
        glbPath,
        inStock,
        stockLevel: !inStock ? 'out' : unitsInStock <= 3 ? 'low' : 'high',
        unitsInStock,
        hideWhenOutOfStock: v.hide_when_out_of_stock ?? false,
        sortOrder: v.sort_order ?? idx,
        status: v.status,
        effectivePrice,
        effectiveOriginalPrice: v.original_price_override != null ? Number(v.original_price_override) : p.default_original_price != null ? Number(p.default_original_price) : undefined,
        effectiveMaterial: v.material_override || p.default_material || '',
        effectiveWeight: v.weight_override || p.default_weight || '',
        effectiveSpecifications: {
          ...dimensions,
          frameSize: p.frame_size || '',
          ...(v.specifications_override as Record<string, any> || {}),
        },
        effectiveDescription: v.description_override || p.description || '',
        media: [],
        hasPriceOverride: v.price_override !== undefined,
        hasSpecOverride: v.specifications_override !== undefined,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      };
    });

    const defaultVariant = variants[0] || null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      collection: p.collection,
      category: p.category,
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features : [],
      faceShape: Array.isArray(p.face_shape) ? p.face_shape : [],
      defaultPrice,
      defaultOriginalPrice: p.default_original_price != null ? Number(p.default_original_price) : undefined,
      defaultMaterial: p.default_material || '',
      defaultWeight: p.default_weight || '',
      defaultSpecifications: {
        ...dimensions,
        frameSize: p.frame_size || '',
      },
      prescriptionRequired: p.prescription_required === true,
      tryOnAvailable: variants.some((v) => Boolean(v.glbPath)),
      hideWhenOutOfStock: p.hide_when_out_of_stock ?? false,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      variants,
      defaultVariant,
      media,
    };
  } catch (err) {
    console.error('[Storefront] Error getting product by slug from Supabase:', err);
    return null;
  }
}
