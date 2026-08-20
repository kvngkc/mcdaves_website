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
    glbPath: '/models/glasses.glb',
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
    glbPath: '/models/glasses.glb',
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
    glbPath: '/models/glasses.glb',
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
    glbPath: '/models/glasses.glb',
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

class CommerceRepository {
  private products: Map<string, Product> = new Map();
  private variants: Map<string, ProductVariant> = new Map();
  private media: Map<string, ProductMedia> = new Map();
  private customers: Map<string, Customer> = new Map(); // key: customerId
  private customerPhoneIndex: Map<string, string> = new Map(); // phone -> customerId
  private orderIntents: Map<string, OrderIntent> = new Map(); // key: intentId
  private lensRequests: Map<string, LensRequest> = new Map();
  private payments: Map<string, Payment> = new Map(); // key: reference
  private orders: Map<string, Order> = new Map(); // key: orderId

  constructor() {
    this.seed();
    if (supabase) {
      this.syncFromSupabase();
    }
  }

  private seed() {
    SEED_PRODUCTS.forEach((p) => this.products.set(p.id, p));
    SEED_VARIANTS.forEach((v) => this.variants.set(v.id, v));
    SEED_MEDIA.forEach((m) => this.media.set(m.id, m));
  }

  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      // 1. Sync Products
      const { data: prods, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) {
        console.warn('[Supabase Sync] Products query notice:', prodErr.message);
      } else if (prods && prods.length > 0) {
        prods.forEach((row) => {
          const p = mapRowToProduct(row);
          this.products.set(p.id, p);
        });
      }

      // 2. Sync Variants
      const { data: vars, error: varErr } = await supabase.from('product_variants').select('*');
      if (varErr) {
        console.warn('[Supabase Sync] Variants query notice:', varErr.message);
      } else if (vars && vars.length > 0) {
        vars.forEach((row) => {
          const v = mapRowToVariant(row);
          this.variants.set(v.id, v);
        });
      }

      // 3. Sync Media
      const { data: mediaRows, error: mediaErr } = await supabase.from('product_media').select('*');
      if (mediaErr) {
        console.warn('[Supabase Sync] Media query notice:', mediaErr.message);
      } else if (mediaRows && mediaRows.length > 0) {
        mediaRows.forEach((row) => {
          const m = mapRowToMedia(row);
          this.media.set(m.id, m);
        });
      }

      // 4. Sync Customers
      const { data: custs, error: custErr } = await supabase.from('customers').select('*');
      if (custErr) {
        console.warn('[Supabase Sync] Customers query notice:', custErr.message);
      } else if (custs && custs.length > 0) {
        custs.forEach((row) => {
          const c = mapRowToCustomer(row);
          this.customers.set(c.id, c);
          if (c.phone) {
            const clean = c.phone.replace(/[^0-9+]/g, '');
            this.customerPhoneIndex.set(clean, c.id);
          }
        });
      }

      // 5. Sync Order Intents
      const { data: intents, error: intentErr } = await supabase.from('order_intents').select('*');
      if (intentErr) {
        console.warn('[Supabase Sync] Order intents query notice:', intentErr.message);
      } else if (intents && intents.length > 0) {
        intents.forEach((row) => {
          const intent = mapRowToOrderIntent(row);
          this.orderIntents.set(intent.id, intent);
        });
      }

      // 6. Sync Confirmed Orders
      const { data: orderRows, error: orderErr } = await supabase.from('orders').select('*');
      if (orderErr) {
        console.warn('[Supabase Sync] Orders query notice:', orderErr.message);
      } else if (orderRows && orderRows.length > 0) {
        orderRows.forEach((row) => {
          const ord = mapRowToOrder(row);
          this.orders.set(ord.id, ord);
        });
      }

      // 7. Sync Payments
      const { data: payRows, error: payErr } = await supabase.from('payments').select('*');
      if (payErr) {
        console.warn('[Supabase Sync] Payments query notice:', payErr.message);
      } else if (payRows && payRows.length > 0) {
        payRows.forEach((row) => {
          const pay = mapRowToPayment(row);
          this.payments.set(pay.reference, pay);
        });
      }

      // 8. Sync Lens Requests
      const { data: lensRows, error: lensErr } = await supabase.from('lens_requests').select('*');
      if (lensErr) {
        console.warn('[Supabase Sync] Lens requests query notice:', lensErr.message);
      } else if (lensRows && lensRows.length > 0) {
        lensRows.forEach((row) => {
          const lr = mapRowToLensRequest(row);
          this.lensRequests.set(lr.id, lr);
        });
      }
    } catch (err) {
      console.error('[Supabase Sync] Error during database synchronization:', err);
    }
  }

  // ─── Products & Variants ───────────────────────────────────────────────────

  public getAllProducts(includeAllStatuses = false): ResolvedProduct[] {
    return Array.from(this.products.values())
      .filter((p) => includeAllStatuses || p.status === 'ACTIVE')
      .map((p) => this.resolveProduct(p));
  }

  public getProductBySlug(slug: string): ResolvedProduct | null {
    const product = Array.from(this.products.values()).find(
      (p) => p.slug === slug && p.status === 'ACTIVE',
    );
    if (!product) return null;
    return this.resolveProduct(product);
  }

  public getProductById(id: string): ResolvedProduct | null {
    const product = this.products.get(id);
    if (!product) return null;
    return this.resolveProduct(product);
  }

  public getProductVariantBySlug(
    productSlug: string,
    variantSlug: string,
  ): { product: ResolvedProduct; variant: ResolvedProductVariant } | null {
    const product = this.getProductBySlug(productSlug);
    if (!product) return null;

    const variant = product.variants.find((v) => v.slug === variantSlug);
    if (!variant) return null;

    return { product, variant };
  }

  public getVariantById(variantId: string): ResolvedProductVariant | null {
    const variant = this.variants.get(variantId);
    if (!variant) return null;

    const parent = this.products.get(variant.productId);
    if (!parent) return null;

    return this.resolveVariant(parent, variant);
  }

  public createProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(newProduct.id, newProduct);
    if (supabase) {
      supabase.from('products').upsert(mapProductToRow(newProduct)).then();
    }
    return newProduct;
  }

  public updateProduct(product: Partial<Product> & { id: string }): Product {
    const existing = this.products.get(product.id);
    if (!existing) throw new Error(`Product ${product.id} not found`);
    const updated = {
      ...existing,
      ...product,
      updatedAt: new Date().toISOString(),
    };
    this.products.set(product.id, updated);
    if (supabase) {
      supabase.from('products').upsert(mapProductToRow(updated)).then();
    }
    return updated;
  }

  public deleteProduct(id: string): boolean {
    for (const [varId, variant] of this.variants.entries()) {
      if (variant.productId === id) {
        this.variants.delete(varId);
      }
    }
    for (const [mediaId, media] of this.media.entries()) {
      if (media.productId === id) {
        this.media.delete(mediaId);
      }
    }
    const res = this.products.delete(id);
    if (supabase) {
      supabase.from('products').delete().eq('id', id).then();
    }
    return res;
  }

  public createVariant(variant: Omit<ProductVariant, 'createdAt' | 'updatedAt'>): ProductVariant {
    const now = new Date().toISOString();
    const newVariant: ProductVariant = {
      ...variant,
      createdAt: now,
      updatedAt: now,
    };
    this.variants.set(newVariant.id, newVariant);
    if (supabase) {
      supabase.from('product_variants').upsert(mapVariantToRow(newVariant)).then();
    }
    return newVariant;
  }

  public updateVariant(
    variant: Partial<ProductVariant> & { id: string },
  ): ProductVariant {
    const existing = this.variants.get(variant.id);
    if (!existing) throw new Error(`Variant ${variant.id} not found`);
    const updated = {
      ...existing,
      ...variant,
      updatedAt: new Date().toISOString(),
    };
    this.variants.set(variant.id, updated);
    if (supabase) {
      supabase.from('product_variants').upsert(mapVariantToRow(updated)).then();
    }
    return updated;
  }

  public deleteVariant(id: string): boolean {
    for (const [mediaId, media] of this.media.entries()) {
      if (media.variantId === id) {
        this.media.delete(mediaId);
      }
    }
    const res = this.variants.delete(id);
    if (supabase) {
      supabase.from('product_variants').delete().eq('id', id).then();
    }
    return res;
  }

  public async decrementVariantStock(
    variantId: string,
    quantity: number,
  ): Promise<{ success: boolean; remaining: number; message?: string }> {
    // 1. Try PostgreSQL atomic stored procedure if Supabase is connected
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('decrement_variant_stock', {
          p_variant_id: variantId,
          p_quantity: quantity,
        });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const res = data[0];
          // Sync local in-memory map
          const localVariant = this.variants.get(variantId);
          if (localVariant) {
            localVariant.unitsInStock = res.remaining_stock;
            localVariant.inStock = res.remaining_stock > 0;
            localVariant.stockLevel =
              res.remaining_stock === 0 ? 'out' : res.remaining_stock <= 3 ? 'low' : 'high';
            localVariant.updatedAt = new Date().toISOString();
          }
          return {
            success: res.success,
            remaining: res.remaining_stock,
            message: res.message,
          };
        }
      } catch (rpcErr) {
        console.warn('[Repository] RPC decrement_variant_stock notice, using local fallback:', rpcErr);
      }
    }

    // 2. In-memory fallback with database sync
    const variant = this.variants.get(variantId);
    if (!variant) {
      return { success: false, remaining: 0, message: 'Variant not found' };
    }

    if (variant.unitsInStock < quantity) {
      return {
        success: false,
        remaining: variant.unitsInStock,
        message: 'Insufficient stock',
      };
    }

    variant.unitsInStock = Math.max(0, variant.unitsInStock - quantity);
    variant.inStock = variant.unitsInStock > 0;
    variant.stockLevel =
      variant.unitsInStock === 0 ? 'out' : variant.unitsInStock <= 3 ? 'low' : 'high';
    variant.updatedAt = new Date().toISOString();

    if (supabase) {
      supabase
        .from('product_variants')
        .update({
          units_in_stock: variant.unitsInStock,
          in_stock: variant.inStock,
          stock_level: variant.stockLevel,
          updated_at: variant.updatedAt,
        })
        .eq('id', variantId)
        .then();
    }

    return {
      success: true,
      remaining: variant.unitsInStock,
      message: 'Stock decremented successfully',
    };
  }

  public addProductMedia(media: ProductMedia): ProductMedia {
    this.media.set(media.id, media);
    if (supabase) {
      supabase
        .from('product_media')
        .upsert(mapMediaToRow(media))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist product media:', error.message);
        });
    }
    return media;
  }

  public deleteProductMedia(id: string): boolean {
    const res = this.media.delete(id);
    if (supabase) {
      supabase
        .from('product_media')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to delete product media:', error.message);
        });
    }
    return res;
  }

  private resolveVariant(
    parent: Product,
    variant: ProductVariant,
  ): ResolvedProductVariant {
    const hasPriceOverride = variant.priceOverride !== undefined;
    const hasSpecOverride = variant.specificationsOverride !== undefined;

    const effectiveSpecifications: PhysicalSpecifications = {
      ...parent.defaultSpecifications,
      ...(variant.specificationsOverride || {}),
    };

    // Calculate optical frame size string if dimensions changed
    effectiveSpecifications.frameSize = `${effectiveSpecifications.lensWidthMm}□${effectiveSpecifications.bridgeWidthMm}-${effectiveSpecifications.templeLengthMm}`;

    const variantMedia = Array.from(this.media.values())
      .filter((m) => m.variantId === variant.id || (m.productId === parent.id && !m.variantId))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Fallback if variant has no direct media: use parent media
    const media =
      variantMedia.length > 0
        ? variantMedia
        : Array.from(this.media.values())
            .filter((m) => m.productId === parent.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);

    // Auto compute inStock if unitsInStock is defined
    const inStock =
      variant.unitsInStock !== undefined
        ? variant.unitsInStock > 0
        : variant.inStock;

    const stockLevel =
      variant.unitsInStock !== undefined
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
      effectiveOriginalPrice:
        variant.originalPriceOverride ?? parent.defaultOriginalPrice,
      effectiveMaterial: variant.materialOverride ?? parent.defaultMaterial,
      effectiveWeight: variant.weightOverride ?? parent.defaultWeight,
      effectiveSpecifications,
      effectiveDescription: variant.descriptionOverride ?? parent.description,
      media,
      hasPriceOverride,
      hasSpecOverride,
    };
  }

  private resolveProduct(product: Product): ResolvedProduct {
    const productVariants = Array.from(this.variants.values())
      .filter((v) => {
        if (v.productId !== product.id) return false;
        if (v.status !== 'ACTIVE') return false;
        if (v.hideWhenOutOfStock && ((v.unitsInStock !== undefined && v.unitsInStock === 0) || !v.inStock)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const resolvedVariants = productVariants.map((v) =>
      this.resolveVariant(product, v),
    );

    const defaultVariant =
      resolvedVariants[0] ||
      this.resolveVariant(product, {
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
      });

    const productMedia = Array.from(this.media.values())
      .filter((m) => m.productId === product.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...product,
      variants: resolvedVariants,
      defaultVariant,
      media: productMedia,
    };
  }

  // ─── Customer Identity & Deduplication ─────────────────────────────────────

  /**
   * Deduplicates customers by phone number. If existing, updates contact info.
   * If new, generates a human-readable Customer ID (e.g. "MC-7K4P2").
   */
  public findOrCreateCustomer(params: {
    phone: string;
    name: string;
    email?: string;
  }): Customer {
    const cleanPhone = params.phone.replace(/[^0-9+]/g, '');
    const existingId = this.customerPhoneIndex.get(cleanPhone);

    const now = new Date().toISOString();

    if (existingId && this.customers.has(existingId)) {
      const existing = this.customers.get(existingId)!;
      const updated: Customer = {
        ...existing,
        name: params.name || existing.name,
        email: params.email || existing.email,
        updatedAt: now,
      };
      this.customers.set(existingId, updated);
      if (supabase) {
        supabase
          .from('customers')
          .upsert(mapCustomerToRow(updated))
          .then(({ error }) => {
            if (error) console.error('[Supabase] Failed to update customer:', error.message);
          });
      }
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

    this.customers.set(newCustomer.id, newCustomer);
    this.customerPhoneIndex.set(cleanPhone, newCustomer.id);
    if (supabase) {
      supabase
        .from('customers')
        .upsert(mapCustomerToRow(newCustomer))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist new customer:', error.message);
        });
    }
    return newCustomer;
  }

  public getCustomerById(id: string): Customer | null {
    return this.customers.get(id) || null;
  }

  public getCustomerByPhone(phone: string): Customer | null {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const id = this.customerPhoneIndex.get(cleanPhone);
    if (!id) return null;
    return this.customers.get(id) || null;
  }

  public getAllCustomers(): Customer[] {
    return Array.from(this.customers.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ─── Order Intents ──────────────────────────────────────────────────────────

  public createOrderIntent(params: {
    customer: { name: string; phone: string; email?: string };
    variantId: string;
    quantity: number;
    source?: OrderIntent['source'];
    notes?: string;
    lensRequest?: Omit<LensRequest, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;
    vtoSessionRef?: string;
  }): { intent: OrderIntent; customer: Customer; whatsappUrl: string } {
    const customer = this.findOrCreateCustomer(params.customer);
    const variant = this.getVariantById(params.variantId);
    if (!variant) {
      throw new Error(`Variant ${params.variantId} not found`);
    }

    const product = this.products.get(variant.productId);
    const productName = product?.name || 'Eyewear Frame';

    let lensRequestId: string | undefined;
    if (params.lensRequest) {
      const lensReq = this.createLensRequest({
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
      priceAtIntent: variant.effectivePrice, // Historical snapshot
      currency: 'NGN',
      lensRequestId,
      vtoSessionRef: params.vtoSessionRef,
      status: 'NEW',
      source: params.source || 'whatsapp_cta',
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.orderIntents.set(intent.id, intent);
    if (supabase) {
      supabase
        .from('order_intents')
        .upsert(mapOrderIntentToRow(intent))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist order intent:', error.message);
        });
    }

    // Format WhatsApp message with non-sensitive reference context
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

  public getOrderIntentById(id: string): OrderIntent | null {
    return this.orderIntents.get(id) || null;
  }

  public getAllOrderIntents(): OrderIntent[] {
    return Array.from(this.orderIntents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  public updateOrderIntentStatus(
    id: string,
    status: OrderIntentStatus,
    notes?: string,
  ): OrderIntent {
    const existing = this.orderIntents.get(id);
    if (!existing) throw new Error(`Order intent ${id} not found`);

    const updated: OrderIntent = {
      ...existing,
      status,
      notes: notes ? `${existing.notes ? existing.notes + '\n' : ''}${notes}` : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.orderIntents.set(id, updated);
    if (supabase) {
      supabase
        .from('order_intents')
        .upsert(mapOrderIntentToRow(updated))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to update order intent status:', error.message);
        });
    }
    return updated;
  }

  public setOrderIntentPaymentLink(
    id: string,
    paymentLinkUrl: string,
    paystackReference: string,
  ): OrderIntent {
    const existing = this.orderIntents.get(id);
    if (!existing) throw new Error(`Order intent ${id} not found`);

    const updated: OrderIntent = {
      ...existing,
      paymentLinkUrl,
      paystackReference,
      status: 'AWAITING_CUSTOMER',
      updatedAt: new Date().toISOString(),
    };

    this.orderIntents.set(id, updated);
    if (supabase) {
      supabase
        .from('order_intents')
        .upsert(mapOrderIntentToRow(updated))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to update order intent payment link:', error.message);
        });
    }
    return updated;
  }

  // ─── Lens Requests ──────────────────────────────────────────────────────────

  public createLensRequest(
    params: Omit<LensRequest, 'id' | 'createdAt' | 'updatedAt'>,
  ): LensRequest {
    const id = generateLensRequestId();
    const now = new Date().toISOString();

    const req: LensRequest = {
      ...params,
      id,
      verificationState: params.verificationState || 'CUSTOMER_SUBMITTED',
      createdAt: now,
      updatedAt: now,
    };

    this.lensRequests.set(id, req);
    if (supabase) {
      supabase
        .from('lens_requests')
        .upsert(mapLensRequestToRow(req))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist lens request:', error.message);
        });
    }
    return req;
  }

  public getLensRequestById(id: string): LensRequest | null {
    return this.lensRequests.get(id) || null;
  }

  // ─── Payments & Confirmed Orders ───────────────────────────────────────────

  public recordPayment(params: {
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
  }): Payment {
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

    this.payments.set(params.reference, payment);
    if (supabase) {
      supabase
        .from('payments')
        .upsert(mapPaymentToRow(payment))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist payment:', error.message);
        });
    }
    return payment;
  }

  public getPaymentByReference(reference: string): Payment | null {
    return this.payments.get(reference) || null;
  }

  /**
   * Creates an official Order ONLY after confirmed Paystack payment.
   * Converts the associated OrderIntent to CONVERTED.
   */
  public createOrderFromConfirmedPayment(params: {
    paymentReference: string;
    orderIntentId?: string;
    customerId?: string;
    shippingAddress?: Order['shippingAddress'];
    customerNotes?: string;
  }): { order: Order; payment: Payment } {
    let payment = this.getPaymentByReference(params.paymentReference);
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

    // If linked to an order intent, extract frozen item data
    const intentId = params.orderIntentId || payment.orderIntentId;
    if (intentId) {
      const intent = this.orderIntents.get(intentId);
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
        this.orderIntents.set(intent.id, intent);
      }
    }

    // If no order intent was linked, create item from payment amount
    if (orderItems.length === 0) {
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

    this.orders.set(orderId, order);
    if (supabase) {
      supabase
        .from('orders')
        .upsert(mapOrderToRow(order))
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to persist confirmed order:', error.message);
        });

      if (intentId) {
        const updatedIntent = this.orderIntents.get(intentId);
        if (updatedIntent) {
          supabase
            .from('order_intents')
            .upsert(mapOrderIntentToRow(updatedIntent))
            .then(({ error }) => {
              if (error) console.error('[Supabase] Failed to update converted intent in Supabase:', error.message);
            });
        }
      }
    }
    return { order, payment };
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  public getOrderById(id: string): Order | null {
    return this.orders.get(id) || null;
  }

  public getOrderByPaymentReference(ref: string): Order | null {
    return (
      Array.from(this.orders.values()).find(
        (o) => o.paymentReference === ref,
      ) || null
    );
  }
}

// Global Singleton Instance
export const commerceRepository = new CommerceRepository();
