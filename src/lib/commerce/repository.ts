// src/lib/commerce/repository.ts
/**
 * Commerce Domain Data Access & Persistence Layer for McDaves
 * Thread-safe repository layer with database synchronization.
 */

import 'server-only';

import {
  Product,
  ProductVariant,
  ProductMedia,
  PhysicalSpecifications,
  ResolvedProduct,
  ResolvedProductVariant,
  Customer,
  OrderIntent,
  OrderIntentStatus,
  LensRequest,
  Payment,
  Order,
  OrderItem,
} from './types';
import {
  generateCustomerId,
  generateOrderIntentId,
  generateOrderId,
  generateLensRequestId,
} from './id-generator';
import { siteConfig } from '@/data/site-config';
import {
  supabase,
  mapRowToProduct,
  mapProductToRow,
  mapRowToVariant,
  mapVariantToRow,
  mapRowToMedia,
  mapMediaToRow,
  mapRowToCustomer,
  mapCustomerToRow,
  mapRowToOrderIntent,
  mapOrderIntentToRow,
  mapRowToOrder,
  mapOrderToRow,
  mapRowToPayment,
  mapPaymentToRow,
  mapRowToLensRequest,
  mapLensRequestToRow,
} from '../supabase/service';

// ─── Initial Seed Catalog ─────────────────────────────────────────────────────

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-sightly-001',
    slug: 'classic-havana',
    name: 'Classic Havana',
    collection: 'sightly',
    category: 'unisex',
    description:
      'A timeless round frame that suits every face. Hand-finished acetate with a warm tortoiseshell pattern. Lightweight enough for all-day wear, strong enough to last for years.',
    features: [
      'Hand-polished cellulose acetate',
      'Hypoallergenic material',
      'Prescription-ready frame',
      'Ultra-lightweight comfort',
      'Precision spring hinges',
    ],
    faceShape: ['round', 'oval', 'square'],
    defaultPrice: 35000,
    defaultOriginalPrice: 42000,
    defaultMaterial: 'Acetate',
    defaultWeight: '22g',
    defaultSpecifications: {
      frameWidthMm: 140,
      lensWidthMm: 52,
      bridgeWidthMm: 18,
      templeLengthMm: 140,
      frameSize: '52□18-140',
    },
    prescriptionRequired: true,
    tryOnAvailable: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-sightly-002',
    slug: 'lagos-aviator',
    name: 'Lagos Aviator',
    collection: 'sightly',
    category: 'men',
    description:
      'The Lagos Aviator brings classic pilot style to the modern Nigerian professional. Metal construction with adjustable silicone nose pads for an exact fit.',
    features: [
      'Stainless steel structural frame',
      'Adjustable soft nose pads',
      'UV400 sun protection compatible',
      'Corrosion-resistant electroplating',
      'Reinforced double-bridge brow',
    ],
    faceShape: ['oval', 'heart', 'diamond'],
    defaultPrice: 42000,
    defaultOriginalPrice: 48000,
    defaultMaterial: 'Stainless Steel',
    defaultWeight: '18g',
    defaultSpecifications: {
      frameWidthMm: 142,
      lensWidthMm: 58,
      bridgeWidthMm: 14,
      templeLengthMm: 145,
      frameSize: '58□14-145',
    },
    prescriptionRequired: false,
    tryOnAvailable: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-sightly-003',
    slug: 'ikoyi-cat-eye',
    name: 'Ikoyi Cat-Eye',
    collection: 'sightly',
    category: 'women',
    description:
      'Elegant, elevated, and unmistakably Ikoyi. The Cat-Eye frame adds instant sophistication to any look. TR90 construction makes it feather-light yet virtually unbreakable.',
    features: [
      'TR90 ultra-flexible memory polymer',
      'Extremely durable & feather-light',
      'Prescription-ready lens grooves',
      'Anti-slip comfort temple tips',
      'Sculpted upswept browline',
    ],
    faceShape: ['round', 'oval', 'heart'],
    defaultPrice: 38000,
    defaultOriginalPrice: 45000,
    defaultMaterial: 'TR90 Polymer',
    defaultWeight: '15g',
    defaultSpecifications: {
      frameWidthMm: 138,
      lensWidthMm: 54,
      bridgeWidthMm: 16,
      templeLengthMm: 140,
      frameSize: '54□16-140',
    },
    prescriptionRequired: true,
    tryOnAvailable: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const SEED_VARIANTS: ProductVariant[] = [
  // Classic Havana Variants
  {
    id: 'var-sightly-001-havana',
    productId: 'prod-sightly-001',
    slug: 'havana',
    name: 'Havana Tortoise',
    sku: 'SIG-001-HAV',
    colorName: 'Havana',
    colorHex: '#8B4513',
    vtoCalibrationId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-001-black',
    productId: 'prod-sightly-001',
    slug: 'black',
    name: 'Matte Black',
    sku: 'SIG-001-BLK',
    colorName: 'Black',
    colorHex: '#1A1A1A',
    vtoCalibrationId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 2,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Lagos Aviator Variants
  {
    id: 'var-sightly-002-gold',
    productId: 'prod-sightly-002',
    slug: 'gold',
    name: 'Classic Gold',
    sku: 'SIG-002-GLD',
    colorName: 'Gold',
    colorHex: '#C9A227',
    vtoCalibrationId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-002-gunmetal',
    productId: 'prod-sightly-002',
    slug: 'gunmetal',
    name: 'Brushed Gunmetal',
    sku: 'SIG-002-GUN',
    colorName: 'Gunmetal',
    colorHex: '#4A5568',
    priceOverride: 44000, // Demonstrates price override
    vtoCalibrationId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'low',
    sortOrder: 2,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Ikoyi Cat-Eye Variants
  {
    id: 'var-sightly-003-burgundy',
    productId: 'prod-sightly-003',
    slug: 'burgundy',
    name: 'Deep Burgundy',
    sku: 'SIG-003-BUR',
    colorName: 'Burgundy',
    colorHex: '#800020',
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoCalibrationId: 'meshy-purple-cat-eye',
    inStock: true,
    stockLevel: 'low',
    sortOrder: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-003-black',
    productId: 'prod-sightly-003',
    slug: 'black',
    name: 'Gloss Black',
    sku: 'SIG-003-BLK',
    colorName: 'Black',
    colorHex: '#000000',
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoCalibrationId: 'meshy-purple-cat-eye',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 2,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-003-crystal',
    productId: 'prod-sightly-003',
    slug: 'crystal',
    name: 'Crystal Champagne',
    sku: 'SIG-003-CRY',
    colorName: 'Crystal',
    colorHex: '#E2E8F0',
    specificationsOverride: {
      frameWidthMm: 140, // Demonstrates spec override
    },
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoCalibrationId: 'meshy-purple-cat-eye',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 3,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const SEED_MEDIA: ProductMedia[] = [
  // Classic Havana
  {
    id: 'med-001-1',
    productId: 'prod-sightly-001',
    variantId: 'var-sightly-001-havana',
    type: 'front',
    url: '/images/products/sightly/classic-havana/front.webp',
    altText: 'Classic Havana front view',
    isPrimary: true,
    sortOrder: 1,
  },
  {
    id: 'med-001-2',
    productId: 'prod-sightly-001',
    variantId: 'var-sightly-001-havana',
    type: 'side',
    url: '/images/products/sightly/classic-havana/side.webp',
    altText: 'Classic Havana profile side view',
    isPrimary: false,
    sortOrder: 2,
  },
  {
    id: 'med-001-3',
    productId: 'prod-sightly-001',
    variantId: 'var-sightly-001-havana',
    type: 'lifestyle',
    url: '/images/products/sightly/classic-havana/lifestyle.webp',
    altText: 'Classic Havana lifestyle editorial',
    isPrimary: false,
    sortOrder: 3,
  },

  // Lagos Aviator
  {
    id: 'med-002-1',
    productId: 'prod-sightly-002',
    variantId: 'var-sightly-002-gold',
    type: 'front',
    url: '/images/products/sightly/lagos-aviator/front.webp',
    altText: 'Lagos Aviator Gold front view',
    isPrimary: true,
    sortOrder: 1,
  },
  {
    id: 'med-002-2',
    productId: 'prod-sightly-002',
    variantId: 'var-sightly-002-gold',
    type: 'side',
    url: '/images/products/sightly/lagos-aviator/side.webp',
    altText: 'Lagos Aviator side view',
    isPrimary: false,
    sortOrder: 2,
  },
  {
    id: 'med-002-3',
    productId: 'prod-sightly-002',
    variantId: 'var-sightly-002-gold',
    type: 'lifestyle',
    url: '/images/products/sightly/lagos-aviator/lifestyle.webp',
    altText: 'Lagos Aviator lifestyle editorial',
    isPrimary: false,
    sortOrder: 3,
  },

  // Ikoyi Cat-Eye
  {
    id: 'med-003-1',
    productId: 'prod-sightly-003',
    variantId: 'var-sightly-003-burgundy',
    type: 'front',
    url: '/images/products/sightly/ikoyi-cat-eye/front.webp',
    altText: 'Ikoyi Cat-Eye Burgundy front view',
    isPrimary: true,
    sortOrder: 1,
  },
  {
    id: 'med-003-2',
    productId: 'prod-sightly-003',
    variantId: 'var-sightly-003-burgundy',
    type: 'side',
    url: '/images/products/sightly/ikoyi-cat-eye/side.webp',
    altText: 'Ikoyi Cat-Eye side view',
    isPrimary: false,
    sortOrder: 2,
  },
  {
    id: 'med-003-3',
    productId: 'prod-sightly-003',
    variantId: 'var-sightly-003-burgundy',
    type: 'lifestyle',
    url: '/images/products/sightly/ikoyi-cat-eye/lifestyle.webp',
    altText: 'Ikoyi Cat-Eye lifestyle editorial',
    isPrimary: false,
    sortOrder: 3,
  },
];

// ─── Commerce Repository Class ────────────────────────────────────────────────
// ─── Commerce Repository Class ────────────────────────────────────────────────

class CommerceRepository {
  constructor() {
    // No longer seeding or syncing to memory. Supabase is the primary source of truth.
  }

  // ─── Products & Variants ───────────────────────────────────────────────────

  public async getAllProducts(includeAllStatuses = false): Promise<ResolvedProduct[]> {
    if (!supabase) throw new Error("Supabase client missing");
    
    let query = supabase.from('products').select('*');
    if (!includeAllStatuses) {
      query = query.eq('status', 'ACTIVE');
    }
    
    const { data: prods, error } = await query;
    if (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
    if (!prods || prods.length === 0) return [];

    const products = prods.map(mapRowToProduct);
    return Promise.all(products.map((p) => this.resolveProduct(p)));
  }

  public async getProductBySlug(slug: string): Promise<ResolvedProduct | null> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching product by slug: ${error.message}`);
    }
    if (!data) return null;

    return this.resolveProduct(mapRowToProduct(data));
  }

  public async getProductById(id: string): Promise<ResolvedProduct | null> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error fetching product by id: ${error.message}`);
    if (!data) return null;
    return this.resolveProduct(mapRowToProduct(data));
  }

  public async getProductVariantBySlug(
    productSlug: string,
    variantSlug: string,
  ): Promise<{ product: ResolvedProduct; variant: ResolvedProductVariant } | null> {
    const product = await this.getProductBySlug(productSlug);
    if (!product) return null;

    const variant = product.variants.find((v) => v.slug === variantSlug);
    if (!variant) return null;

    return { product, variant };
  }

  public async getVariantById(variantId: string): Promise<ResolvedProductVariant | null> {
    if (!supabase) throw new Error("Supabase client missing");

    const { data: variantData, error: variantError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (variantError) throw new Error(`Error fetching variant by id: ${variantError.message}`);
    if (!variantData) return null;
    const variant = mapRowToVariant(variantData);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', variant.productId)
      .maybeSingle();

    if (productError) throw new Error(`Error fetching product for variant: ${productError.message}`);
    if (!productData) return null;
    const product = mapRowToProduct(productData);

    return this.resolveVariant(product, variant);
  }

  public async createProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!supabase) throw new Error("Supabase client missing");
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      createdAt: now,
      updatedAt: now,
    };
    
    const { error } = await supabase.from('products').upsert(mapProductToRow(newProduct));
    if (error) throw new Error(error.message);
    return newProduct;
  }

  public async updateProduct(product: Partial<Product> & { id: string }): Promise<Product> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const existing = await this.getProductById(product.id);
    if (!existing) throw new Error(`Product ${product.id} not found`);

    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date().toISOString(),
    };
    
    // Convert ResolvedProduct fields back to raw Product
    delete (updated as any).variants;
    delete (updated as any).defaultVariant;
    delete (updated as any).media;

    const { error } = await supabase.from('products').upsert(mapProductToRow(updated));
    if (error) throw new Error(error.message);
    return updated;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) throw new Error("Supabase client missing");
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
    return true;
  }

  public async createVariant(variant: Omit<ProductVariant, 'createdAt' | 'updatedAt'>): Promise<ProductVariant> {
    if (!supabase) throw new Error("Supabase client missing");
    const now = new Date().toISOString();
    const newVariant: ProductVariant = {
      ...variant,
      createdAt: now,
      updatedAt: now,
    };
    const { error } = await supabase.from('product_variants').upsert(mapVariantToRow(newVariant));
    if (error) throw new Error(error.message);
    return newVariant;
  }

  public async updateVariant(variant: Partial<ProductVariant> & { id: string }): Promise<ProductVariant> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const existing = await this.getVariantById(variant.id);
    if (!existing) throw new Error(`Variant ${variant.id} not found`);

    const updated: ProductVariant = {
      ...existing,
      ...variant,
      updatedAt: new Date().toISOString(),
    };
    
    // Clean up Resolved properties before saving
    delete (updated as any).inStock;
    delete (updated as any).stockLevel;
    delete (updated as any).effectivePrice;
    delete (updated as any).effectiveOriginalPrice;
    delete (updated as any).effectiveMaterial;
    delete (updated as any).effectiveWeight;
    delete (updated as any).effectiveSpecifications;
    delete (updated as any).effectiveDescription;
    delete (updated as any).media;
    delete (updated as any).hasPriceOverride;
    delete (updated as any).hasSpecOverride;

    const { error } = await supabase.from('product_variants').upsert(mapVariantToRow(updated));
    if (error) throw new Error(error.message);
    return updated;
  }

  public async deleteVariant(id: string): Promise<boolean> {
    if (!supabase) throw new Error("Supabase client missing");
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) {
      throw new Error(`Error deleting variant: ${error.message}`);
    }
    return true;
  }

  public async decrementVariantStock(
    variantId: string,
    quantity: number,
  ): Promise<{ success: boolean; remaining: number; message?: string }> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const { data, error } = await supabase.rpc('decrement_variant_stock', {
      p_variant_id: variantId,
      p_quantity: quantity,
    });

    if (error) {
      throw new Error(`RPC decrement_variant_stock failed: ${error.message}`);
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const res = data[0];
      return {
        success: res.success,
        remaining: res.remaining_stock,
        message: res.message,
      };
    }

    return { success: false, remaining: 0, message: 'Unknown RPC response' };
  }

  public async addProductMedia(media: ProductMedia): Promise<ProductMedia> {
    if (!supabase) throw new Error("Supabase client missing");
    const { error } = await supabase.from('product_media').upsert(mapMediaToRow(media));
    if (error) throw new Error(error.message);
    return media;
  }

  public async deleteProductMedia(id: string): Promise<boolean> {
    if (!supabase) throw new Error("Supabase client missing");
    const { error } = await supabase.from('product_media').delete().eq('id', id);
    if (error) {
      throw new Error(`Error deleting product media: ${error.message}`);
    }
    return true;
  }

  private async resolveVariant(
    parent: Product,
    variant: ProductVariant,
  ): Promise<ResolvedProductVariant> {
    const hasPriceOverride = variant.priceOverride !== undefined;
    const hasSpecOverride = variant.specificationsOverride !== undefined;

    const effectiveSpecifications: PhysicalSpecifications = {
      ...parent.defaultSpecifications,
      ...(variant.specificationsOverride || {}),
    };
    effectiveSpecifications.frameSize = `${effectiveSpecifications.lensWidthMm}□${effectiveSpecifications.bridgeWidthMm}-${effectiveSpecifications.templeLengthMm}`;

    if (!supabase) throw new Error("Supabase client missing");

    const { data: mediaRows } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', parent.id)
      .order('sort_order', { ascending: true });
      
    const allParentMedia = (mediaRows || []).map(mapRowToMedia);
    
    const variantMedia = allParentMedia.filter(
      (m) => m.variantId === variant.id || !m.variantId
    );

    const media = variantMedia.length > 0 ? variantMedia : allParentMedia;

    const inStock = variant.unitsInStock !== undefined ? variant.unitsInStock > 0 : variant.inStock;
    const stockLevel = variant.unitsInStock !== undefined
        ? variant.unitsInStock === 0
          ? 'out'
          : variant.unitsInStock <= 3
          ? 'low'
          : 'high'
        : variant.stockLevel;

    return {
      ...variant,
      inStock,
      stockLevel,
      effectivePrice: variant.priceOverride ?? parent.defaultPrice,
      effectiveOriginalPrice: variant.originalPriceOverride ?? parent.defaultOriginalPrice,
      effectiveMaterial: variant.materialOverride ?? parent.defaultMaterial,
      effectiveWeight: variant.weightOverride ?? parent.defaultWeight,
      effectiveSpecifications,
      effectiveDescription: variant.descriptionOverride ?? parent.description,
      media,
      hasPriceOverride,
      hasSpecOverride,
    };
  }

  private async resolveProduct(product: Product): Promise<ResolvedProduct> {
    if (!supabase) throw new Error("Supabase client missing");

    const { data: variantRows } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    let productVariants = (variantRows || []).map(mapRowToVariant).filter((v) => {
      if (v.status !== 'ACTIVE') return false;
      if (v.hideWhenOutOfStock && ((v.unitsInStock !== undefined && v.unitsInStock === 0) || !v.inStock)) {
        return false;
      }
      return true;
    });

    const resolvedVariants = await Promise.all(
      productVariants.map((v) => this.resolveVariant(product, v))
    );

    const defaultVariant = resolvedVariants.find(v => v.glbPath && v.inStock) || resolvedVariants.find(v => v.glbPath) || resolvedVariants[0] || (await this.resolveVariant(product, {
      id: `default-${product.id}`,
      productId: product.id,
      slug: 'default',
      name: 'Default',
      sku: `${product.id}-DEF`,
      colorName: 'Standard',
      colorHex: '#000000',
      inStock: true,
      stockLevel: 'high',
      sortOrder: 0,
      status: 'ACTIVE',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    const { data: mediaRows } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });
      
    const productMedia = (mediaRows || []).map(mapRowToMedia);

    return {
      ...product,
      variants: resolvedVariants,
      defaultVariant,
      media: productMedia,
    };
  }

  // ─── Customer Identity & Deduplication ─────────────────────────────────────

  public async findOrCreateCustomer(params: {
    phone: string;
    name: string;
    email?: string;
  }): Promise<Customer> {
    if (!supabase) throw new Error("Supabase client missing");
    const cleanPhone = params.phone.replace(/[^0-9+]/g, '');
    const now = new Date().toISOString();

    const { data: existingData } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingData) {
      const existing = mapRowToCustomer(existingData);
      const updated: Customer = {
        ...existing,
        name: params.name || existing.name,
        email: params.email || existing.email,
        updatedAt: now,
      };
      
      await supabase.from('customers').upsert(mapCustomerToRow(updated));
      return updated;
    }

    const newCustomer: Customer = {
      id: generateCustomerId(),
      phone: cleanPhone,
      name: params.name.trim(),
      email: params.email?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    await supabase.from('customers').upsert(mapCustomerToRow(newCustomer));
    return newCustomer;
  }

  public async getCustomerById(id: string): Promise<Customer | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRowToCustomer(data);
  }

  public async getCustomerByPhone(phone: string): Promise<Customer | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const { data, error } = await supabase.from('customers').select('*').eq('phone', cleanPhone).maybeSingle();
    if (error || !data) return null;
    return mapRowToCustomer(data);
  }

  public async getAllCustomers(): Promise<Customer[]> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapRowToCustomer);
  }

  // ─── Order Intents ──────────────────────────────────────────────────────────

  public async createOrderIntent(params: {
    customer: { name: string; phone: string; email?: string };
    variantId: string;
    quantity: number;
    source?: OrderIntent['source'];
    notes?: string;
    lensRequest?: Omit<LensRequest, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;
    vtoSessionRef?: string;
  }): Promise<{ intent: OrderIntent; customer: Customer; whatsappUrl: string }> {
    const customer = await this.findOrCreateCustomer(params.customer);
    const variant = await this.getVariantById(params.variantId);
    
    if (!variant) {
      throw new Error(`Variant ${params.variantId} not found`);
    }

    const product = await this.getProductById(variant.productId);
    const productName = product?.name || 'Eyewear Frame';

    let lensRequestId: string | undefined;
    if (params.lensRequest) {
      const lensReq = await this.createLensRequest({
        ...params.lensRequest,
        customerId: customer.id,
      });
      lensRequestId = lensReq.id;
    }

    const intentId = generateOrderIntentId();
    const now = new Date().toISOString();

    const intent: OrderIntent = {
      id: intentId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      productId: variant.productId,
      productName,
      variantId: variant.id,
      variantName: variant.name,
      variantSku: variant.sku,
      quantity: Math.max(1, params.quantity || 1),
      priceAtIntent: variant.effectivePrice,
      currency: 'NGN',
      lensRequestId,
      vtoSessionRef: params.vtoSessionRef,
      status: 'NEW',
      source: params.source || 'whatsapp_cta',
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    if (supabase) {
      const { error } = await supabase.from('order_intents').upsert(mapOrderIntentToRow(intent));
      if (error) {
        console.error('[Supabase] Failed to persist order intent:', error.message);
        throw new Error(`Failed to persist order intent: ${error.message}`);
      }
    }

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
    const waText = [
      `Hi McDaves Optical!`,
      ``,
      `*Customer:* ${customer.name}`,
      `*McDaves Ref:* ${customer.id}`,
      `*Order Intent:* ${intent.id}`,
      `*Product:* ${productName}`,
      `*Variant:* ${variant.name} (${variant.colorName})`,
      `*Quantity:* ${intent.quantity}`,
      `*Price:* ₦${intent.priceAtIntent.toLocaleString()}`,
      ...(intent.lensRequestId ? [`*Lens Details:* Requested with order intent`] : []),
      ``,
      `I would like assistance with completing this order. Thank you!`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    intent.whatsappReference = whatsappUrl;

    return { intent, customer, whatsappUrl };
  }

  public async getOrderIntentById(id: string): Promise<OrderIntent | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('order_intents').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRowToOrderIntent(data);
  }

  public async getAllOrderIntents(): Promise<OrderIntent[]> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('order_intents').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapRowToOrderIntent);
  }

  public async updateOrderIntentStatus(
    id: string,
    status: OrderIntentStatus,
    notes?: string,
  ): Promise<OrderIntent> {
    if (!supabase) throw new Error("Supabase client missing");
    const existing = await this.getOrderIntentById(id);
    if (!existing) throw new Error(`Order intent ${id} not found`);

    const updated: OrderIntent = {
      ...existing,
      status,
      notes: notes ? `${existing.notes ? existing.notes + '\n' : ''}${notes}` : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('order_intents').upsert(mapOrderIntentToRow(updated));
    if (error) {
      throw new Error(`Failed to update order intent status: ${error.message}`);
    }
    
    return updated;
  }

  public async setOrderIntentPaymentLink(
    id: string,
    paymentLinkUrl: string,
    paystackReference: string,
  ): Promise<OrderIntent> {
    if (!supabase) throw new Error("Supabase client missing");
    const existing = await this.getOrderIntentById(id);
    if (!existing) throw new Error(`Order intent ${id} not found`);

    const updated: OrderIntent = {
      ...existing,
      paymentLinkUrl,
      paystackReference,
      status: 'AWAITING_CUSTOMER',
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('order_intents').upsert(mapOrderIntentToRow(updated));
    if (error) {
      throw new Error(`Failed to update order intent payment link: ${error.message}`);
    }
    
    return updated;
  }

  // ─── Lens Requests ──────────────────────────────────────────────────────────

  public async createLensRequest(
    params: Omit<LensRequest, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LensRequest> {
    if (!supabase) throw new Error("Supabase client missing");
    const id = generateLensRequestId();
    const now = new Date().toISOString();

    const req: LensRequest = {
      ...params,
      id,
      verificationState: params.verificationState || 'CUSTOMER_SUBMITTED',
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from('lens_requests').upsert(mapLensRequestToRow(req));
    if (error) {
      throw new Error(`Failed to persist lens request: ${error.message}`);
    }
    
    return req;
  }

  public async getLensRequestById(id: string): Promise<LensRequest | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('lens_requests').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRowToLensRequest(data);
  }

  // ─── Payments & Confirmed Orders ───────────────────────────────────────────

  public async recordPayment(params: {
    reference: string;
    orderIntentId?: string;
    customerId: string;
    amount: number;
    currency?: string;
    status: Payment['status'];
    channel?: string;
    paidAt?: string;
    paystackAccessCode?: string;
    gatewayResponse?: Record<string, unknown>;
  }): Promise<Payment> {
    if (!supabase) throw new Error("Supabase client missing");
    const now = new Date().toISOString();
    const payment: Payment = {
      id: `pay-${params.reference}`,
      reference: params.reference,
      orderIntentId: params.orderIntentId,
      customerId: params.customerId,
      amount: params.amount,
      currency: params.currency || 'NGN',
      status: params.status,
      channel: params.channel,
      paidAt: params.paidAt,
      paystackAccessCode: params.paystackAccessCode,
      gatewayResponse: params.gatewayResponse,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from('payments').upsert(mapPaymentToRow(payment));
    if (error) {
      console.error('[Supabase] Failed to persist payment:', error.message);
      throw new Error(`Failed to persist payment: ${error.message}`);
    }
    
    return payment;
  }

  public async getPaymentByReference(reference: string): Promise<Payment | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('payments').select('*').eq('reference', reference).maybeSingle();
    if (error || !data) return null;
    return mapRowToPayment(data);
  }

  public async createOrderFromConfirmedPayment(params: {
    paymentReference: string;
    orderIntentId?: string;
    customerId?: string;
    shippingAddress?: Order['shippingAddress'];
    customerNotes?: string;
  }): Promise<{ order: Order; payment: Payment }> {
    if (!supabase) throw new Error("Supabase client missing");
    
    let payment = await this.getPaymentByReference(params.paymentReference);
    if (!payment) {
      throw new Error(`Payment reference ${params.paymentReference} not found`);
    }

    if (payment.status !== 'PAID') {
      throw new Error(`Cannot create order: Payment is in state "${payment.status}"`);
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const orderItems: OrderItem[] = [];

    let customerId = payment.customerId || params.customerId || 'MC-ANON';
    let subtotal = payment.amount;
    const shippingFee = 0;

    const intentId = params.orderIntentId || payment.orderIntentId;
    if (intentId) {
      const intent = await this.getOrderIntentById(intentId);
      if (intent) {
        customerId = intent.customerId;
        subtotal = intent.priceAtIntent * intent.quantity;

        orderItems.push({
          id: `item-${orderId}-1`,
          orderId,
          variantId: intent.variantId,
          productName: intent.productName,
          variantName: intent.variantName,
          sku: intent.variantSku,
          unitPrice: intent.priceAtIntent,
          quantity: intent.quantity,
          totalPrice: intent.priceAtIntent * intent.quantity,
          lensRequestId: intent.lensRequestId,
        });

        // Mark Intent as CONVERTED
        intent.status = 'CONVERTED';
        intent.updatedAt = now;
        const { error: intentError } = await supabase.from('order_intents').upsert(mapOrderIntentToRow(intent));
        if (intentError) {
          throw new Error(`Failed to update converted intent in Supabase: ${intentError.message}`);
        }
      }
    }

    if (orderItems.length === 0) {
      const metadata = payment.gatewayResponse || {};
      const metadataItems = metadata.orderItems;
      
      if (Array.isArray(metadataItems) && metadataItems.length > 0) {
        metadataItems.forEach((item: Record<string, unknown>, index: number) => {
          orderItems.push({
            id: `item-${orderId}-${index + 1}`,
            orderId,
            variantId: (item.variantId as string) || 'custom-item',
            productName: (item.name as string) || (item.productName as string) || 'Eyewear Frame Purchase',
            variantName: (item.color as string) || (item.variantName as string) || 'Online Payment',
            sku: (item.variantSku as string) || 'MCD-ONLINE-PAY',
            unitPrice: Number(item.unitPrice || item.price || payment.amount),
            quantity: Number(item.quantity || 1),
            totalPrice: Number(item.totalPrice || payment.amount),
          });
        });
      } else {
        orderItems.push({
          id: `item-${orderId}-1`,
          orderId,
          variantId: 'custom-item',
          productName: 'Eyewear Frame Purchase',
          variantName: 'Online Payment',
          sku: 'MCD-ONLINE-PAY',
          unitPrice: payment.amount,
          quantity: 1,
          totalPrice: payment.amount,
        });
      }
    }

    const order: Order = {
      id: orderId,
      orderIntentId: intentId,
      customerId,
      paymentId: payment.id,
      paymentReference: payment.reference,
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount: payment.amount,
      currency: payment.currency,
      status: 'CONFIRMED',
      shippingAddress: params.shippingAddress,
      customerNotes: params.customerNotes,
      createdAt: now,
      updatedAt: now,
    };

    const { error: orderError } = await supabase.from('orders').upsert(mapOrderToRow(order));
    if (orderError) {
      console.error('[Supabase] Failed to persist confirmed order:', orderError.message);
      throw new Error(`Failed to persist confirmed order: ${orderError.message}`);
    }

    return { order, payment };
  }

  public async getAllOrders(): Promise<Order[]> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapRowToOrder);
  }

  public async getOrderById(id: string): Promise<Order | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRowToOrder(data);
  }

  public async getOrderByPaymentReference(ref: string): Promise<Order | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('orders').select('*').eq('payment_reference', ref).maybeSingle();
    if (error || !data) return null;
    return mapRowToOrder(data);
  }

  public async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    if (!supabase) throw new Error("Supabase client missing");
    
    // First find customers with this email
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email);
      
    if (custError || !customers || customers.length === 0) return [];
    
    const customerIds = customers.map(c => c.id);
    
    // Then find their orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .in('customer_id', customerIds)
      .order('created_at', { ascending: false });
      
    if (orderError || !orders) return [];
    
    return orders.map(mapRowToOrder);
  }

  public async processConfirmedPayment(params: {
    paymentReference: string;
    orderIntentId?: string;
    customerId?: string;
    amount: number;
    currency: string;
    channel?: string;
    paidAt?: string;
    gatewayResponse?: Record<string, unknown>;
    items: Partial<OrderItem>[];
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  }): Promise<{ success: boolean; orderId?: string; message?: string }> {
    if (!supabase) throw new Error("Supabase client missing");
    
    const { data, error } = await supabase.rpc('process_confirmed_payment', {
      p_payment_ref: params.paymentReference,
      p_order_intent_id: params.orderIntentId || null,
      p_customer_id: params.customerId || 'MC-ANON',
      p_amount: params.amount,
      p_currency: params.currency,
      p_channel: params.channel || null,
      p_paid_at: params.paidAt || new Date().toISOString(),
      p_gateway_response: params.gatewayResponse || {},
      p_items: params.items,
      p_subtotal: params.subtotal,
      p_shipping_fee: params.shippingFee,
      p_total_amount: params.totalAmount
    });

    if (error) {
      console.error('[Repository] RPC process_confirmed_payment failed:', error.message);
      throw new Error(`Payment processing failed: ${error.message}`);
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const res = data[0];
      if (!res.success) throw new Error(res.message);
      return {
        success: res.success,
        orderId: res.order_id,
        message: res.message,
      };
    }

    throw new Error('Unknown RPC response during payment processing');
  }
}

// Global Singleton Instance
export const commerceRepository = new CommerceRepository();
