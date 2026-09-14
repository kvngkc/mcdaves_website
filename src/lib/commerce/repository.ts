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
    vtoAssetId: 'classic-havana-glasses',
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
    colorHex: '#1A1A1A',
    sku: 'SIG-001-BLK',
    colorName: 'Black',
    vtoAssetId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 2,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-002-gold',
    productId: 'prod-sightly-002',
    slug: 'gold',
    name: 'Classic Gold',
    colorHex: '#C9A227',
    sku: 'SIG-002-GLD',
    colorName: 'Gold',
    vtoAssetId: 'classic-havana-glasses',
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
    colorHex: '#4A5568',
    sku: 'SIG-002-GUN',
    colorName: 'Gunmetal',
    priceOverride: 44000,
    vtoAssetId: 'classic-havana-glasses',
    inStock: true,
    stockLevel: 'low',
    sortOrder: 2,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'var-sightly-003-burgundy',
    productId: 'prod-sightly-003',
    slug: 'burgundy',
    name: 'Deep Burgundy',
    colorHex: '#800020',
    sku: 'SIG-003-BUR',
    colorName: 'Burgundy',
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoAssetId: 'meshy-purple-cat-eye',
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
    colorHex: '#000000',
    sku: 'SIG-003-BLK',
    colorName: 'Black',
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoAssetId: 'meshy-purple-cat-eye',
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
    colorHex: '#E2E8F0',
    sku: 'SIG-003-CRY',
    colorName: 'Crystal',
    specificationsOverride: {
      frameWidthMm: 140,
    },
    glbPath: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vtoAssetId: 'meshy-purple-cat-eye',
    inStock: true,
    stockLevel: 'high',
    sortOrder: 3,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const SEED_MEDIA: ProductMedia[] = [];

export class CommerceRepository {
  constructor() {}

  public async getAllProducts(includeAllStatuses = false): Promise<ResolvedProduct[]> {
    if (!supabase) throw new Error("Supabase client missing");
    let query = supabase.from('products').select('*');
    if (!includeAllStatuses) query = query.eq('status', 'ACTIVE');
    const { data: prods, error } = await query;
    if (error) throw new Error(`Error fetching products: ${error.message}`);
    if (!prods || prods.length === 0) return [];
    const products = prods.map(mapRowToProduct);
    return Promise.all(products.map((p) => this.resolveProduct(p)));
  }

  public async getProductBySlug(slug: string): Promise<ResolvedProduct | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).eq('status', 'ACTIVE').maybeSingle();
    if (error) throw new Error(`Error fetching product by slug: ${error.message}`);
    if (!data) return null;
    return this.resolveProduct(mapRowToProduct(data));
  }

  public async getProductById(id: string): Promise<ResolvedProduct | null> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Error fetching product by id: ${error.message}`);
    if (!data) return null;
    return this.resolveProduct(mapRowToProduct(data));
  }

  public async getProductVariantBySlug(productSlug: string, variantSlug: string): Promise<{ product: ResolvedProduct; variant: ResolvedProductVariant } | null> {
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
      .select('*, vto_asset_calibrations(asset_id, vto_glb_url, status)')
      .eq('id', variantId)
      .maybeSingle();
    if (variantError) throw new Error(`Error fetching variant by id: ${variantError.message}`);
    if (!variantData) return null;
    const variant = mapRowToVariant(variantData) as ProductVariant & { vto_asset_calibrations?: any };
    variant.vto_asset_calibrations = variantData.vto_asset_calibrations;
    const { data: productData, error: productError } = await supabase.from('products').select('*').eq('id', variant.productId).maybeSingle();
    if (productError) throw new Error(`Error fetching product for variant: ${productError.message}`);
    if (!productData) return null;
    return this.resolveVariant(mapRowToProduct(productData), variant);
  }

  public async createProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!supabase) throw new Error("Supabase client missing");
    const now = new Date().toISOString();
    const newProduct: Product = { ...product, createdAt: now, updatedAt: now };
    const { error } = await supabase.from('products').upsert(mapProductToRow(newProduct));
    if (error) throw new Error(error.message);
    return newProduct;
  }

  public async updateProduct(product: Partial<Product> & { id: string }): Promise<Product> {
    if (!supabase) throw new Error("Supabase client missing");
    const existing = await this.getProductById(product.id);
    if (!existing) throw new Error(`Product ${product.id} not found`);
    const updated: Product = { ...existing, ...product, updatedAt: new Date().toISOString() };
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
    if (error) throw new Error(`Error deleting product: ${error.message}`);
    return true;
  }

  public async createVariant(variant: Omit<ProductVariant, 'createdAt' | 'updatedAt'>): Promise<ProductVariant> {
    if (!supabase) throw new Error("Supabase client missing");
    const now = new Date().toISOString();
    const newVariant: ProductVariant = { ...variant, createdAt: now, updatedAt: now };
    const { error } = await supabase.from('product_variants').upsert(mapVariantToRow(newVariant));
    if (error) throw new Error(error.message);
    return newVariant;
  }

  public async updateVariant(variant: Partial<ProductVariant> & { id: string }): Promise<ProductVariant> {
    if (!supabase) throw new Error("Supabase client missing");
    const existing = await this.getVariantById(variant.id);
    if (!existing) throw new Error(`Variant ${variant.id} not found`);
    const updated: ProductVariant = { ...existing, ...variant, updatedAt: new Date().toISOString() };
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
    if (error) throw new Error(`Error deleting variant: ${error.message}`);
    return true;
  }

  public async decrementVariantStock(variantId: string, quantity: number): Promise<{ success: boolean; remaining: number; message?: string }> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data, error } = await supabase.rpc('decrement_variant_stock', { p_variant_id: variantId, p_quantity: quantity });
    if (error) throw new Error(`RPC decrement_variant_stock failed: ${error.message}`);
    if (data && Array.isArray(data) && data.length > 0) {
      const res = data[0];
      return { success: res.success, remaining: res.remaining_stock, message: res.message };
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
    if (error) throw new Error(`Error deleting product media: ${error.message}`);
    return true;
  }

  private async resolveVariant(parent: Product, variant: ProductVariant): Promise<ResolvedProductVariant> {
    const hasPriceOverride = variant.priceOverride !== undefined;
    const hasSpecOverride = variant.specificationsOverride !== undefined;
    const effectiveSpecifications: PhysicalSpecifications = {
      ...parent.defaultSpecifications,
      ...(variant.specificationsOverride || {}),
    };
    effectiveSpecifications.frameSize = `${effectiveSpecifications.lensWidthMm}□${effectiveSpecifications.bridgeWidthMm}-${effectiveSpecifications.templeLengthMm}`;
    if (!supabase) throw new Error("Supabase client missing");
    const { data: mediaRows } = await supabase.from('product_media').select('*').eq('product_id', parent.id).order('sort_order', { ascending: true });
    const allParentMedia = (mediaRows || []).map(mapRowToMedia);
    const variantMedia = allParentMedia.filter((m) => m.variantId === variant.id || !m.variantId);
    const media = variantMedia.length > 0 ? variantMedia : allParentMedia;
    const inStock = variant.unitsInStock !== undefined ? variant.unitsInStock > 0 : variant.inStock;
    const stockLevel = variant.unitsInStock !== undefined ? variant.unitsInStock === 0 ? 'out' : variant.unitsInStock <= 3 ? 'low' : 'high' : variant.stockLevel;

    // A published calibration is the preferred VTO asset. Until calibration exists,
    // preserve the uploaded source GLB so the UI can offer VTO and the calibration
    // workflow can operate on the same variant asset. Never invent a fallback path.
    let resolvedGlbPath: string | undefined = undefined;
    const vto = (variant as any).vto_asset_calibrations;
    if (vto && vto.status === 'PUBLISHED' && vto.vto_glb_url && vto.vto_glb_url.trim() !== '') {
      resolvedGlbPath = vto.vto_glb_url;
    } else if (typeof variant.glbPath === 'string' && variant.glbPath.trim() !== '') {
      resolvedGlbPath = variant.glbPath;
    }

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
      glbPath: resolvedGlbPath,
      media,
      hasPriceOverride,
      hasSpecOverride,
    };
  }

  private async resolveProduct(product: Product): Promise<ResolvedProduct> {
    if (!supabase) throw new Error("Supabase client missing");
    const { data: variantRows } = await supabase.from('product_variants').select('*, vto_asset_calibrations(asset_id, vto_glb_url, status)').eq('product_id', product.id).order('sort_order', { ascending: true });
    let productVariants = (variantRows || []).map((row) => {
      const v = mapRowToVariant(row) as ProductVariant & { vto_asset_calibrations?: any };
      v.vto_asset_calibrations = row.vto_asset_calibrations;
      return v;
    }).filter((v) => {
      if (v.status !== 'ACTIVE') return false;
      if (v.hideWhenOutOfStock && ((v.unitsInStock !== undefined && v.unitsInStock === 0) || !v.inStock)) return false;
      return true;
    });
    const resolvedVariants = await Promise.all(productVariants.map((v) => this.resolveVariant(product, v)));
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
    const { data: mediaRows } = await supabase.from('product_media').select('*').eq('product_id', product.id).order('sort_order', { ascending: true });
    const productMedia = (mediaRows || []).map(mapRowToMedia);
    return { ...product, variants: resolvedVariants, defaultVariant, media: productMedia };
  }

  // ─── Customer Identity & Deduplication ─────────────────────────────────────

  public async findOrCreateCustomer(params: { phone: string; name: string; email?: string }): Promise<Customer> {
    if (!supabase) throw new Error("Supabase client missing");
    const cleanPhone = params.phone.replace(/[^0-9+]/g, '');
    const now = new Date().toISOString();
    const { data: existingData } = await supabase.from('customers').select('*').eq('phone', cleanPhone).maybeSingle();
    if (existingData) {
      const existing = mapRowToCustomer(existingData);
      const updates: Partial<Customer> = { name: params.name, email: params.email || existing.email, updatedAt: now };
      await supabase.from('customers').update(mapCustomerToRow({ ...existing, ...updates })).eq('id', existing.id);
      return { ...existing, ...updates };
    }
    const customer: Customer = { id: generateCustomerId(), phone: cleanPhone, name: params.name, email: params.email, createdAt: now, updatedAt: now };
    const { error } = await supabase.from('customers').insert(mapCustomerToRow(customer));
    if (error) throw new Error(error.message);
    return customer;
  }

  // NOTE: Remaining order/payment/lens methods are intentionally unchanged below this point.
