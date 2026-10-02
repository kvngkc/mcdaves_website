// src/context/CartContext.tsx
'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Product as StorefrontProduct } from '@/lib/types';
import { ResolvedProduct } from '@/lib/commerce/types';
import { deliveryConfig } from '@/config/services';

type CartProduct = ResolvedProduct | StorefrontProduct;

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: CartProduct, variantId: string, variantSku: string, quantity?: number, color?: string, priceOverride?: number, unitsInStock?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  subtotal: number;
  delivery: number;
  total: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'mcdaves_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) queueMicrotask(() => setItems(parsed));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      throw new Error('Cart data was corrupted and has been cleared.');
    } finally {
      queueMicrotask(() => setIsHydrated(true));
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items, isHydrated]);

  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);
  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: CartProduct, variantId: string, variantSku: string, quantity = 1, color?: string, priceOverride?: number, unitsInStock?: number) => {
    setItems((prevItems) => {
      const isResolvedProduct = 'defaultPrice' in product;
      const basePrice = isResolvedProduct ? product.defaultPrice : product.price;
      const effectivePrice = priceOverride ?? basePrice;
      const existingIndex = prevItems.findIndex((item) => item.variantId === variantId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQuantity = existing.quantity + quantity;
        if (unitsInStock !== undefined && newQuantity > unitsInStock) {
          alert(`Cannot add more than ${unitsInStock} units to cart.`);
          return prevItems;
        }
        updated[existingIndex] = { ...existing, quantity: newQuantity, price: effectivePrice };
        return updated;
      }

      const rawBaseImage = isResolvedProduct ? (product.media?.[0]?.url || '/images/products/sightly/classic-havana/front.webp') : (product.images?.[0] || '/images/products/sightly/classic-havana/front.webp');
      const image = typeof rawBaseImage === 'string' && rawBaseImage.trim() !== '' ? rawBaseImage : '/images/products/placeholder.webp';

      if (unitsInStock !== undefined && quantity > unitsInStock) {
        alert(`Cannot add more than ${unitsInStock} units to cart.`);
        return prevItems;
      }

      const newItem: CartItem = {
        productId: product.id,
        variantId,
        variantSku,
        slug: product.slug,
        name: product.name,
        price: effectivePrice,
        color,
        image,
        quantity,
        prescriptionRequired: product.prescriptionRequired ?? false,
        unitsInStock,
      };
      return [...prevItems, newItem];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((variantId: string) => setItems((prevItems) => prevItems.filter((item) => item.variantId !== variantId)), []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prevItems) => prevItems.map((item) => {
      if (item.variantId === variantId) {
        if (item.unitsInStock !== undefined && quantity > item.unitsInStock) {
          alert(`Cannot add more than ${item.unitsInStock} units to cart.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const delivery = useMemo(() => items.length === 0 || subtotal >= deliveryConfig.freeThreshold ? 0 : deliveryConfig.standardFee, [items.length, subtotal]);
  const total = useMemo(() => subtotal + delivery, [subtotal, delivery]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const value = useMemo(() => ({ items, isOpen, addItem, removeItem, updateQuantity, clearCart, toggleDrawer, openDrawer, closeDrawer, subtotal, delivery, total, itemCount }), [items, isOpen, addItem, removeItem, updateQuantity, clearCart, toggleDrawer, openDrawer, closeDrawer, subtotal, delivery, total, itemCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
