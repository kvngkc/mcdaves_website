// src/context/CartContext.tsx
'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Product } from '@/lib/types';
import { deliveryConfig } from '@/config/services';

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    color?: string,
    variantId?: string,
    variantSku?: string,
    priceOverride?: number,
  ) => void;
  removeItem: (productId: string, color?: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, variantId?: string) => void;
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when items change (only after initial hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items, isHydrated]);

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
      color?: string,
      variantId?: string,
      variantSku?: string,
      priceOverride?: number,
    ) => {
      setItems((prevItems) => {
        const itemVariantId = variantId;
        const itemColor = color;
        const effectivePrice = priceOverride ?? product.price;

        const existingIndex = prevItems.findIndex((item) => {
          if (itemVariantId && item.variantId) {
            return item.variantId === itemVariantId;
          }
          if (itemColor !== undefined) {
            return item.productId === product.id && item.color === itemColor;
          }
          return item.productId === product.id;
        });

        if (existingIndex > -1) {
          const updated = [...prevItems];
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + quantity,
            price: effectivePrice,
          };
          return updated;
        }

        const image =
          product.images?.[0] ||
          '/images/products/sightly/classic-havana/front.webp';

        const newItem: CartItem = {
          productId: product.id,
          variantId: itemVariantId,
          variantSku: variantSku,
          slug: product.slug,
          name: product.name,
          price: effectivePrice,
          color: itemColor,
          image,
          quantity,
          prescriptionRequired: product.prescriptionRequired ?? false,
        };

        return [...prevItems, newItem];
      });
      setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((productId: string, color?: string, variantId?: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => {
        if (variantId && item.variantId) {
          return item.variantId !== variantId;
        }
        if (color !== undefined) {
          return !(item.productId === productId && item.color === color);
        }
        return item.productId !== productId;
      })
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, color?: string, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(productId, color, variantId);
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) => {
          const match =
            variantId && item.variantId
              ? item.variantId === variantId
              : color !== undefined
              ? item.productId === productId && item.color === color
              : item.productId === productId;

          if (match) {
            return { ...item, quantity };
          }
          return item;
        })
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Calculated values
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // Canonical SSOT Delivery rules: free if subtotal >= freeThreshold or if cart is empty
  const delivery = useMemo(() => {
    if (items.length === 0 || subtotal >= deliveryConfig.freeThreshold) return 0;
    return deliveryConfig.standardFee;
  }, [items.length, subtotal]);

  const total = useMemo(() => {
    return subtotal + delivery;
  }, [subtotal, delivery]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      toggleDrawer,
      openDrawer,
      closeDrawer,
      subtotal,
      delivery,
      total,
      itemCount,
    }),
    [
      items,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      toggleDrawer,
      openDrawer,
      closeDrawer,
      subtotal,
      delivery,
      total,
      itemCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
