// src/components/ui/Price.tsx
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PriceProps {
  /** Current selling price in Naira (numeric, no formatting needed) */
  amount: number;
  /** Original / RRP price — shows as strikethrough when provided */
  originalAmount?: number;
  /** Override currency symbol (default: ₦) */
  currencySymbol?: string;
  /** Override currency code label (default: 'NGN') */
  currencyCode?: string;
  /** Controls the font size of the primary price */
  size?: PriceSize;
  /** Show a "X% OFF" badge when both amount and originalAmount are provided */
  showDiscount?: boolean;
  /** Dim the price to indicate out-of-stock / unavailable */
  muted?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOCALE = 'en-NG';

/** Format a number as Nigerian Naira without the ISO symbol (we add our own ₦) */
function formatNGN(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function discountPercent(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<PriceSize, { price: string; original: string; symbol: string }> = {
  sm: {
    price:    'text-body-sm font-semibold',
    original: 'text-caption',
    symbol:   'text-xs',
  },
  md: {
    price:    'text-h4 font-semibold',
    original: 'text-body-sm',
    symbol:   'text-body-sm',
  },
  lg: {
    price:    'text-h3 font-bold',
    original: 'text-body',
    symbol:   'text-body',
  },
  xl: {
    price:    'text-h2 font-bold',
    original: 'text-h4',
    symbol:   'text-h4',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Price({
  amount,
  originalAmount,
  currencySymbol = '₦',
  currencyCode,
  size = 'md',
  showDiscount = true,
  muted = false,
  className = '',
}: PriceProps) {
  const s = sizeMap[size];
  const hasOriginal = originalAmount !== undefined && originalAmount > amount;
  const discount = hasOriginal ? discountPercent(originalAmount!, amount) : 0;

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${
        muted ? 'opacity-50' : ''
      } ${className}`}
    >
      {/* ── Current price ── */}
      <span className={`${s.price} text-neutral-900 leading-none`}>
        <span className={`${s.symbol} font-medium`} aria-hidden="true">
          {currencySymbol}
        </span>
        {formatNGN(amount)}
        {/* Screen-reader-friendly label */}
        <span className="sr-only">
          {currencyCode ?? 'NGN'} {amount.toLocaleString(LOCALE)}
        </span>
      </span>

      {/* ── Original / strikethrough price ── */}
      {hasOriginal && (
        <span
          className={`${s.original} text-neutral-400 line-through leading-none`}
          aria-label={`Original price ${currencySymbol}${formatNGN(originalAmount!)}`}
        >
          {currencySymbol}{formatNGN(originalAmount!)}
        </span>
      )}

      {/* ── Discount badge ── */}
      {hasOriginal && showDiscount && discount > 0 && (
        <span
          className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[0.625rem] font-bold text-accent-rose leading-none"
          aria-label={`${discount}% discount`}
        >
          -{discount}%
        </span>
      )}
    </span>
  );
}

export default Price;
