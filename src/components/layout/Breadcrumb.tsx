// src/components/layout/Breadcrumb.tsx
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current (last) page */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Show the Home icon+label as the first item (default: true) */
  showHome?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Breadcrumb({
  items,
  showHome = true,
  className = '',
}: BreadcrumbProps) {
  // Prepend home item
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : [...items];

  return (
    <nav
      aria-label="Breadcrumb"
      // Visible on all sizes; scroll-x on mobile with no-scrollbar to keep it clean.
      // Relative + mask creates a right-edge gradient scroll affordance.
      className={`relative flex items-center ${className}`}
      style={{
        // Fade out the right edge to signal more content exists on narrow screens
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent 100%)',
        maskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent 100%)',
      }}
    >
      <ol
        role="list"
        className="flex items-center gap-y-1 overflow-x-auto no-scrollbar whitespace-nowrap"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {allItems.map((item, index) => {
          const isLast   = index === allItems.length - 1;
          const isHome   = index === 0 && showHome;
          const position = index + 1;

          return (
            <li
              key={`${item.href ?? item.label}-${index}`}
              className="flex items-center flex-shrink-0"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {/* Separator (skip before first item) */}
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 mx-1.5 flex-shrink-0 text-neutral-400"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                /* Current page — no link, bold, truncated to prevent overflow */
                <span
                  aria-current="page"
                  className="text-caption font-semibold text-neutral-800 max-w-[160px] truncate"
                  itemProp="name"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? '/'}
                  className={
                    'inline-flex items-center gap-1 text-caption font-medium ' +
                    'text-neutral-500 hover:text-brand-600 ' +
                    'transition-colors duration-150 ' +
                    'focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-500'
                  }
                  itemProp="item"
                >
                  {isHome && (
                    <Home className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}

              {/* Schema.org position */}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
