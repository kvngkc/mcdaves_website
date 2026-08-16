// src/context/CartContext.tsx
'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Product } from '@/lib/types';

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, color?: string) => void;
  removeItem: (productId: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string) => void;
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

  const addItem = useCallback((product: Product, quantity: number = 1, color?: string) => {
    const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0].name : undefined);
    const displayImage = product.images?.[0] || '/images/products/placeholder.webp';

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.color === selectedColor
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      const newItem: CartItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity,
        color: selectedColor,
        prescriptionRequired: product.prescriptionRequired ?? false,
        image: displayImage,
      };

      return [...prevItems, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string, color?: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => {
        if (color !== undefined) {
          return !(item.productId === productId && item.color === color);
        }
        return item.productId !== productId;
      })
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, color?: string) => {
    if (quantity <= 0) {
      removeItem(productId, color);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        const match = color !== undefined
          ? item.productId === productId && item.color === color
          : item.productId === productId;

        if (match) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Calculated values
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // Delivery rules: ₦2,500 flat fee, free if subtotal >= ₦50,000 or if cart is empty
  const delivery = useMemo(() => {
    if (items.length === 0 || subtotal >= 50000) return 0;
    return 2500;
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
