// src/components/sections/CartDrawer.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button, Price } from '@/components/ui';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    subtotal,
    delivery,
    total,
    itemCount,
  } = useCart();

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    },
    [isOpen, closeDrawer]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    // z-[70]: above WhatsApp btn (z-floating=60), below MobileNav (z-[80])
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop — sits at the same stacking context as the outer div */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel — z-[80] places it above the backdrop inside this stacking context */}
      <div className="relative flex flex-col w-full max-w-md h-full bg-white shadow-2xl z-[80] overflow-hidden transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-brand-700" aria-hidden="true" />
            <h2 className="text-h4 font-semibold text-neutral-900">Your Cart</h2>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-100 text-brand-800 text-caption font-bold">
              {itemCount}
            </span>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart drawer"
            className="p-2.5 rounded-lg text-neutral-400 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-h4 font-semibold text-neutral-900 mb-2">Your cart is empty</h3>
              <p className="text-body-sm text-neutral-500 max-w-xs mb-6">
                Explore our handcrafted Sightly optical frames and discover your next pair.
              </p>
              <Link
                href="/shop/collections/sightly/"
                onClick={closeDrawer}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-sm gap-2 text-body-sm min-h-[44px] w-full sm:w-auto"
              >
                <span>Shop Sightly Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Cart Items List */
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={`${item.productId}-${item.color ?? 'default'}`} className="py-4 flex gap-3 sm:gap-4 first:pt-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop/${item.slug}/`}
                          onClick={closeDrawer}
                          className="font-semibold text-neutral-900 hover:text-brand-700 transition-colors text-body-sm truncate"
                        >
                          {item.name}
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.color)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="text-neutral-400 hover:text-accent-rose transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.color && (
                        <p className="text-caption text-neutral-500 mt-0.5">
                          Color: <span className="font-medium text-neutral-700">{item.color}</span>
                        </p>
                      )}

                      {item.prescriptionRequired && (
                        <span className="inline-block mt-1 text-[11px] font-medium text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                          Prescription Ready
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 flex-wrap sm:flex-nowrap">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.color)}
                          aria-label="Decrease quantity"
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-caption font-semibold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.color)}
                          aria-label="Increase quantity"
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <Price amount={item.price * item.quantity} size="sm" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (Calculations & Checkout) */}
        {items.length > 0 && (
          <div className="border-t border-neutral-100 bg-neutral-50/70 p-5 sm:p-6 pb-safe space-y-4">
            {/* Delivery threshold indicator */}
            {subtotal < 50000 ? (
              <p className="text-caption text-neutral-600 bg-brand-50/80 p-2.5 rounded-lg border border-brand-100 text-center">
                Add <span className="font-semibold text-brand-800"><Price amount={50000 - subtotal} size="sm" /></span> more for <span className="font-bold text-brand-700">FREE Delivery</span> nationwide!
              </p>
            ) : (
              <p className="text-caption text-brand-700 bg-brand-50 p-2.5 rounded-lg border border-brand-200 text-center font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                You qualify for FREE nationwide delivery!
              </p>
            )}

            <div className="space-y-2 text-body-sm">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Subtotal</span>
                <Price amount={subtotal} size="sm" />
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>Delivery</span>
                <span>
                  {delivery === 0 ? (
                    <span className="font-semibold text-brand-700">Free</span>
                  ) : (
                    <Price amount={delivery} size="sm" />
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-900 font-semibold text-body pt-2 border-t border-neutral-200">
                <span>Total</span>
                <Price amount={total} size="md" />
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <Link href="/checkout/" onClick={closeDrawer} className="block w-full">
                <Button variant="primary" size="lg" fullWidth trailingIcon={<ArrowRight className="w-4 h-4" />}>
                  Proceed to Checkout
                </Button>
              </Link>

              <button
                type="button"
                onClick={closeDrawer}
                className="w-full text-center text-caption font-medium text-neutral-500 hover:text-neutral-800 transition-colors py-2"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
