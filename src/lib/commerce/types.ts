// src/lib/commerce/types.ts
/**
 * Relational Commerce Domain Model for McDaves Eyewear
 * Industry-standard B2C commerce modeling with Parent Product -> Exact Sellable Variants.
 */

export type ProductCategory = 'men' | 'women' | 'unisex' | 'sunglasses';
export type ProductCollection = 'sightly';
export type StockLevel = 'high' | 'low' | 'out';

export interface ProductMedia {
  id: string;
  variantId?: string;
  productId: string;
  type: 'front' | 'side' | 'lifestyle' | 'model' | 'detail';
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PhysicalSpecifications {
  /** Total frame width in mm (e.g. 140) */
  frameWidthMm: number;
  /** Lens width in mm (e.g. 52) */
  lensWidthMm: number;
  /** Bridge width in mm (e.g. 18) */
  bridgeWidthMm: number;
  /** Temple arm length in mm (e.g. 140) */
  templeLengthMm: number;
  /** Optical frame size string (e.g. "52□18-140") */
  frameSize: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  collection: ProductCollection;
  category: ProductCategory;
  description: string;
  features: string[];
  faceShape: ('round' | 'oval' | 'square' | 'heart' | 'diamond')[];
  
  // Default values inherited by variants unless overridden
  defaultPrice: number;
  defaultOriginalPrice?: number;
  defaultMaterial: string;
  defaultWeight: string;
  defaultSpecifications: PhysicalSpecifications;
  
  prescriptionRequired: boolean;
  tryOnAvailable: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  slug: string; // e.g. "havana", "black", "burgundy"
  name: string; // e.g. "Havana", "Matte Black"
  sku: string;  // e.g. "SIG-001-HAV"
  colorName: string;
  colorHex: string;
  
  // Overrides (if undefined, inherits from parent Product)
  priceOverride?: number;
  originalPriceOverride?: number;
  materialOverride?: string;
  weightOverride?: string;
  specificationsOverride?: Partial<PhysicalSpecifications>;
  descriptionOverride?: string;
  
  // 3D & VTO Assets specific to this exact variant
  glbPath?: string;
  vtoCalibrationId?: string;
  
  // Inventory & Availability
  inStock: boolean;
  stockLevel: StockLevel;
  unitsInStock?: number;
  hideWhenOutOfStock?: boolean;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

/** Resolved variant with all inherited values calculated */
export interface ResolvedProductVariant extends ProductVariant {
  effectivePrice: number;
  effectiveOriginalPrice?: number;
  effectiveMaterial: string;
  effectiveWeight: string;
  effectiveSpecifications: PhysicalSpecifications;
  effectiveDescription: string;
  media: ProductMedia[];
  hasPriceOverride: boolean;
  hasSpecOverride: boolean;
}

export interface ResolvedProduct extends Product {
  variants: ResolvedProductVariant[];
  defaultVariant: ResolvedProductVariant;
  media: ProductMedia[];
}

// ─── Customer Identity ────────────────────────────────────────────────────────
export interface Customer {
  /** Human-readable Customer ID, e.g. "MC-7K4P2" */
  id: string;
  /** Primary contact/deduplication key */
  phone: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Lens Request ─────────────────────────────────────────────────────────────
export type LensOption = 'plano' | 'upload' | 'whatsapp' | 'values';
export type LensVerificationState = 'CUSTOMER_SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface PrescriptionValues {
  sphereOD?: string;
  cylOD?: string;
  axisOD?: string;
  sphereOS?: string;
  cylOS?: string;
  axisOS?: string;
  pd?: string; // Pupillary Distance
}

export interface LensRequest {
  id: string;
  customerId: string;
  option: LensOption;
  prescriptionValues?: PrescriptionValues;
  prescriptionDocumentUrl?: string;
  requestedLensType?: string; // e.g. 'single-vision', 'blue-block', 'photochromic'
  requestedCoatings?: string[]; // e.g. ['anti-reflective', 'scratch-resistant']
  customerNotes?: string;
  verificationState: LensVerificationState;
  verifiedBy?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Order Intent ─────────────────────────────────────────────────────────────
export type OrderIntentStatus =
  | 'NEW'
  | 'WHATSAPP_OPENED'
  | 'CONTACTED'
  | 'IN_CONVERSATION'
  | 'CONSULTATION'
  | 'AWAITING_CUSTOMER'
  | 'CONVERTED'
  | 'LOST'
  | 'CANCELLED';

export interface OrderIntent {
  /** Human-readable Order Intent Reference, e.g. "ORD-INT-2026-00481" */
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  variantSku: string;
  
  quantity: number;
  /** Historical price snapshot at the moment intent was captured */
  priceAtIntent: number;
  currency: string;
  
  lensRequestId?: string;
  vtoSessionRef?: string;
  
  status: OrderIntentStatus;
  source: 'whatsapp_cta' | 'vto_cta' | 'direct' | 'cart';
  notes?: string;
  whatsappReference?: string;
  assignedAgent?: string;
  
  // Payment link generated by agent/system
  paymentLinkUrl?: string;
  paystackReference?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ─── Payment Record ───────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  reference: string; // Paystack reference
  orderIntentId?: string;
  customerId: string;
  amount: number; // in NGN
  currency: string;
  status: PaymentStatus;
  channel?: string;
  paidAt?: string;
  paystackAccessCode?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Confirmed Order ──────────────────────────────────────────────────────────
export type OrderStatus =
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_DELIVERY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  lensRequestId?: string;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  deliveryMethod: 'door' | 'pickup';
}

export interface Order {
  /** Human-readable Order Reference, e.g. "ORD-2026-00102" */
  id: string;
  orderIntentId?: string;
  customerId: string;
  paymentId: string;
  paymentReference: string;
  
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  
  status: OrderStatus;
  shippingAddress?: ShippingAddress;
  customerNotes?: string;
  internalNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ─── VTO Asset Calibration ──────────────────────────────────────────────────
export interface VTOAssetCalibration {
  id: string;
  assetId: string;
  name: string;
  status: 'UPLOADED' | 'INSPECTED' | 'CALIBRATED' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  frameWidthMm: number;
  lensWidthMm?: number;
  bridgeWidthMm?: number;
  templeLengthMm?: number;
  bridge: {
    x: number;
    y: number;
    z: number;
  };
  measuredNativeWidth: number;
  widthMultiplier: number;
  rotationOffsetEuler?: {
    x: number;
    y: number;
    z: number;
  };
  sourceGlbUrl: string;
  vtoGlbUrl: string;
  previewImages: string[];
  metadataSource: string;
  createdAt: string;
  updatedAt: string;
}

