// src/lib/supabase/service.ts
/**
 * Supabase Data Mapping Layer — Row ↔ Domain Type Conversions
 *
 * SECURITY: This file no longer contains the Supabase client initialization.
 * Clients are split into server-only and browser-safe modules:
 *
 *   Server (service role, server-only import guard):
 *     import { supabaseServer } from '@/lib/supabase/server'
 *
 *   Browser (anon key, subject to RLS):
 *     import { supabaseClient } from '@/lib/supabase/client'
 *
 * The `supabase` export below re-exports the server client for backwards
 * compatibility with existing API route handlers and the repository.
 * It is safe ONLY because this file is imported exclusively from server-side
 * modules (repository.ts, storefront-catalog.ts, API routes).
 */

import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseServer } from './server';
import {
  Product,
  ProductVariant,
  ProductMedia,
  OrderIntent,
  Order,
  Customer,
  Payment,
  LensRequest,
  VTOAssetCalibration,
  RawVTOAssetCalibration,
} from '../commerce/types';

/**
 * Backwards-compatible alias for the server-only Supabase client.
 * All existing imports of `supabase` from this module continue to work,
 * and are now guaranteed to be server-only by the 'server-only' guard above.
 */
export const supabase: SupabaseClient | null = supabaseServer;

/**
 * Maps database row to Domain Product
 */
export function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    collection: row.collection || 'sightly',
    category: row.category || 'unisex',
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    faceShape: Array.isArray(row.face_shape) ? row.face_shape : [],
    defaultPrice: Number(row.default_price) || 35000,
    defaultOriginalPrice: row.default_original_price ? Number(row.default_original_price) : undefined,
    defaultMaterial: row.default_material || 'Acetate',
    defaultWeight: row.default_weight || '22g',
    defaultSpecifications: {
      frameWidthMm: Number(row.frame_width_mm) || 140,
      lensWidthMm: Number(row.lens_width_mm) || 52,
      bridgeWidthMm: Number(row.bridge_width_mm) || 18,
      templeLengthMm: Number(row.temple_length_mm) || 140,
      frameSize: row.frame_size || '52□18-140',
    },
    prescriptionRequired: row.prescription_required ?? true,
    tryOnAvailable: row.try_on_available ?? true,
    status: row.status || 'ACTIVE',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Domain Product to database row
 */
export function mapProductToRow(product: Product): any {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    collection: product.collection,
    category: product.category,
    description: product.description,
    features: product.features,
    face_shape: product.faceShape,
    default_price: product.defaultPrice,
    default_original_price: product.defaultOriginalPrice,
    default_material: product.defaultMaterial,
    default_weight: product.defaultWeight,
    frame_width_mm: product.defaultSpecifications?.frameWidthMm || 140,
    lens_width_mm: product.defaultSpecifications?.lensWidthMm || 52,
    bridge_width_mm: product.defaultSpecifications?.bridgeWidthMm || 18,
    temple_length_mm: product.defaultSpecifications?.templeLengthMm || 140,
    frame_size: product.defaultSpecifications?.frameSize || '52□18-140',
    prescription_required: product.prescriptionRequired,
    try_on_available: product.tryOnAvailable,
    status: product.status,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps database row to Domain ProductVariant
 */
export function mapRowToVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    colorName: row.color_name,
    colorHex: row.color_hex,
    priceOverride: row.price_override ? Number(row.price_override) : undefined,
    originalPriceOverride: row.original_price_override ? Number(row.original_price_override) : undefined,
    materialOverride: row.material_override || undefined,
    weightOverride: row.weight_override || undefined,
    specificationsOverride: row.specifications_override || undefined,
    descriptionOverride: row.description_override || undefined,
    glbPath: row.glb_path || undefined,
    vtoAssetId: row.vto_asset_id || undefined,
    inStock: row.in_stock ?? true,
    stockLevel: row.stock_level || 'high',
    unitsInStock: row.units_in_stock ?? 10,
    hideWhenOutOfStock: row.hide_when_out_of_stock ?? false,
    sortOrder: row.sort_order ?? 0,
    status: row.status || 'ACTIVE',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Domain ProductVariant to database row
 */
export function mapVariantToRow(variant: ProductVariant): any {
  return {
    id: variant.id,
    product_id: variant.productId,
    slug: variant.slug,
    name: variant.name,
    sku: variant.sku,
    color_name: variant.colorName,
    color_hex: variant.colorHex,
    price_override: variant.priceOverride,
    original_price_override: variant.originalPriceOverride,
    material_override: variant.materialOverride,
    weight_override: variant.weightOverride,
    specifications_override: variant.specificationsOverride,
    description_override: variant.descriptionOverride,
    glb_path: variant.glbPath,
    vto_asset_id: variant.vtoAssetId,
    in_stock: variant.inStock,
    stock_level: variant.stockLevel,
    units_in_stock: variant.unitsInStock,
    hide_when_out_of_stock: variant.hideWhenOutOfStock,
    sort_order: variant.sortOrder,
    status: variant.status,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps database row to Domain ProductMedia
 */
export function mapRowToMedia(row: any): ProductMedia {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id || undefined,
    type: row.type || 'front',
    url: row.url,
    altText: row.alt_text || '',
    isPrimary: row.is_primary ?? false,
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * Maps Domain ProductMedia to database row
 */
export function mapMediaToRow(media: ProductMedia): any {
  return {
    id: media.id,
    product_id: media.productId,
    variant_id: media.variantId || null,
    type: media.type,
    url: media.url,
    alt_text: media.altText || '',
    is_primary: media.isPrimary,
    sort_order: media.sortOrder,
  };
}

/**
 * Maps database row to Customer
 */
export function mapRowToCustomer(row: any): Customer {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Customer to database row
 */
export function mapCustomerToRow(customer: Customer): any {
  return {
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    email: customer.email || null,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}

/**
 * Maps database row to OrderIntent
 */
export function mapRowToOrderIntent(row: any): OrderIntent {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    productId: row.product_id,
    productName: row.product_name,
    variantId: row.variant_id,
    variantName: row.variant_name,
    variantSku: row.variant_sku,
    quantity: row.quantity ?? 1,
    priceAtIntent: Number(row.price_at_intent),
    currency: row.currency || 'NGN',
    lensRequestId: row.lens_request_id || undefined,
    vtoSessionRef: row.vto_session_ref || undefined,
    status: row.status || 'NEW',
    source: row.source || 'whatsapp_cta',
    notes: row.notes || undefined,
    paymentLinkUrl: row.payment_link_url || undefined,
    whatsappReference: row.whatsapp_reference || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps OrderIntent to database row
 */
export function mapOrderIntentToRow(intent: OrderIntent): any {
  return {
    id: intent.id,
    customer_id: intent.customerId,
    customer_name: intent.customerName,
    customer_phone: intent.customerPhone,
    customer_email: intent.customerEmail || null,
    product_id: intent.productId,
    product_name: intent.productName,
    variant_id: intent.variantId,
    variant_name: intent.variantName,
    variant_sku: intent.variantSku,
    quantity: intent.quantity,
    price_at_intent: intent.priceAtIntent,
    currency: intent.currency,
    lens_request_id: intent.lensRequestId || null,
    vto_session_ref: intent.vtoSessionRef || null,
    status: intent.status,
    source: intent.source,
    notes: intent.notes || null,
    payment_link_url: intent.paymentLinkUrl || null,
    whatsapp_reference: intent.whatsappReference || null,
    created_at: intent.createdAt,
    updated_at: intent.updatedAt,
  };
}

/**
 * Maps database row to Order
 */
export function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderIntentId: row.order_intent_id || undefined,
    customerId: row.customer_id,
    paymentId: row.payment_id || `pay-${row.payment_reference}`,
    paymentReference: row.payment_reference,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee || 0),
    totalAmount: Number(row.total_amount),
    currency: row.currency || 'NGN',
    status: row.status || 'CONFIRMED',
    shippingAddress: row.shipping_address || undefined,
    customerNotes: row.customer_notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Order to database row
 */
export function mapOrderToRow(order: Order): any {
  return {
    id: order.id,
    order_intent_id: order.orderIntentId || null,
    customer_id: order.customerId,
    payment_id: order.paymentId || null,
    payment_reference: order.paymentReference,
    items: order.items,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total_amount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    shipping_address: order.shippingAddress || null,
    customer_notes: order.customerNotes || null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

/**
 * Maps database row to Payment
 */
export function mapRowToPayment(row: any): Payment {
  return {
    id: row.id,
    reference: row.reference,
    orderIntentId: row.order_intent_id || undefined,
    customerId: row.customer_id,
    amount: Number(row.amount),
    currency: row.currency || 'NGN',
    status: row.status || 'PAID',
    channel: row.channel || undefined,
    paidAt: row.paid_at || undefined,
    gatewayResponse: row.gateway_response || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Payment to database row
 */
export function mapPaymentToRow(payment: Payment): any {
  return {
    id: payment.id,
    reference: payment.reference,
    order_intent_id: payment.orderIntentId || null,
    customer_id: payment.customerId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    channel: payment.channel || null,
    paid_at: payment.paidAt || null,
    gateway_response: payment.gatewayResponse || null,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}

/**
 * Maps database row to LensRequest
 */
export function mapRowToLensRequest(row: any): LensRequest {
  return {
    id: row.id,
    customerId: row.customer_id,
    option: row.option,
    prescriptionValues: row.prescription_values || undefined,
    prescriptionDocumentUrl: row.file_url || undefined,
    verificationState: row.verification_state || 'CUSTOMER_SUBMITTED',
    verificationNotes: row.optician_notes || undefined,
    customerNotes: row.customer_notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps LensRequest to database row
 */
export function mapLensRequestToRow(lensReq: LensRequest): any {
  return {
    id: lensReq.id,
    customer_id: lensReq.customerId,
    option: lensReq.option,
    prescription_values: lensReq.prescriptionValues || null,
    file_url: lensReq.prescriptionDocumentUrl || null,
    verification_state: lensReq.verificationState || 'CUSTOMER_SUBMITTED',
    optician_notes: lensReq.verificationNotes || null,
    customer_notes: lensReq.customerNotes || null,
    created_at: lensReq.createdAt,
    updated_at: lensReq.updatedAt,
  };
}

/**
 * Maps database row to RawVTOAssetCalibration
 */
export function mapRowToVtoCalibration(row: any): RawVTOAssetCalibration {
  return {
    id: row.id,
    assetId: row.asset_id,
    name: row.name,
    status: row.status || undefined,
    frameWidthMm: row.frame_width_mm != null ? Number(row.frame_width_mm) : undefined,
    lensWidthMm: row.lens_width_mm != null ? Number(row.lens_width_mm) : undefined,
    bridgeWidthMm: row.bridge_width_mm != null ? Number(row.bridge_width_mm) : undefined,
    templeLengthMm: row.temple_length_mm != null ? Number(row.temple_length_mm) : undefined,
    bridge: {
      x: row.bridge_x != null ? Number(row.bridge_x) : undefined,
      y: row.bridge_y != null ? Number(row.bridge_y) : undefined,
      z: row.bridge_z != null ? Number(row.bridge_z) : undefined,
    },
    measuredNativeWidth: row.measured_native_width != null ? Number(row.measured_native_width) : undefined,
    widthMultiplier: row.width_multiplier != null ? Number(row.width_multiplier) : undefined,
    rotationOffsetEuler: row.rotation_offset_euler || { x: 0, y: 0, z: 0 },
    sourceGlbUrl: row.source_glb_url,
    vtoGlbUrl: row.vto_glb_url,
    previewImages: Array.isArray(row.preview_images) ? row.preview_images : [],
    metadataSource: row.metadata_source || 'McDaves VTO Automated Asset Ingestion Engine',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps RawVTOAssetCalibration to database row
 */
export function mapVtoCalibrationToRow(calib: RawVTOAssetCalibration): any {
  return {
    id: calib.id,
    asset_id: calib.assetId,
    name: calib.name,
    status: calib.status,
    frame_width_mm: calib.frameWidthMm ?? null,
    lens_width_mm: calib.lensWidthMm ?? null,
    bridge_width_mm: calib.bridgeWidthMm ?? null,
    temple_length_mm: calib.templeLengthMm ?? null,
    bridge_x: calib.bridge.x ?? null,
    bridge_y: calib.bridge.y ?? null,
    bridge_z: calib.bridge.z ?? null,
    measured_native_width: calib.measuredNativeWidth ?? null,
    width_multiplier: calib.widthMultiplier ?? null,
    rotation_offset_euler: calib.rotationOffsetEuler || { x: 0, y: 0, z: 0 },
    source_glb_url: calib.sourceGlbUrl,
    vto_glb_url: calib.vtoGlbUrl,
    preview_images: calib.previewImages,
    metadata_source: calib.metadataSource,
    created_at: calib.createdAt,
    updated_at: calib.updatedAt,
  };
}
