// src/lib/types.ts
// Global TypeScript types and interfaces
export type { Product } from '@/data/products';

export interface CartItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  prescriptionRequired: boolean;
  image: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_DRAWER' };

export interface B2BProduct {
  id: string;
  slug: string;
  name: string;
  category: 'lens-blanks' | 'semi-finished' | 'finished' | 'accessories' | 'equipment';
  description: string;
  specs: Record<string, string>;
  image?: string;
  moq?: string;
}

export interface B2BInquiryItem {
  productId: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface PaymentInitResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface PaymentVerificationResult {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  paidAt?: string;
  channel?: string;
  metadata?: Record<string, any>;
}

export interface InitializePaymentParams {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}
