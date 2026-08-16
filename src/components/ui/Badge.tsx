// src/components/ui/Badge.tsx
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'gold';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Shows a coloured dot before the label */
  dot?: boolean;
  /** Icon element before the label (overrides dot) */
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base =
  'inline-flex items-center gap-1.5 font-semibold rounded-full tracking-wide ' +
  'leading-none whitespace-nowrap select-none';

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-neutral-100 text-neutral-700',
    dot:   'bg-neutral-500',
  },
  success: {
    badge: 'bg-green-50 text-green-700',
    dot:   'bg-green-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700',
    dot:   'bg-amber-500',
  },
  error: {
    badge: 'bg-rose-50 text-accent-rose',
    dot:   'bg-accent-rose',
  },
  gold: {
    badge: 'bg-yellow-50 text-accent-gold border border-yellow-200',
    dot:   'bg-accent-gold',
  },
};

const sizeStyles: Record<BadgeSize, { badge: string; dot: string; icon: string }> = {
  sm: { badge: 'px-2 py-0.5 text-[0.625rem]', dot: 'w-1.5 h-1.5', icon: 'w-3 h-3' },
  md: { badge: 'px-2.5 py-1 text-caption',    dot: 'w-2 h-2',     icon: 'w-3.5 h-3.5' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
}: BadgeProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <span
      className={[base, v.badge, s.badge, className].filter(Boolean).join(' ')}
    >
      {icon ? (
        <span className={`flex-shrink-0 ${s.icon}`} aria-hidden="true">
          {icon}
        </span>
      ) : dot ? (
        <span
          className={`flex-shrink-0 rounded-full ${v.dot} ${s.dot}`}
          aria-hidden="true"
        />
      ) : null}

      {children}
    </span>
  );
}

export default Badge;
