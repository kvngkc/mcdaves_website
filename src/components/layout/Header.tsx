// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Menu } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Shop',      href: '/shop' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Contact',   href: '/contact' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({
  cartItemCount,
  onCartClick,
  onSearchClick,
  onMenuClick,
}: HeaderProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cart Context integration with graceful fallback
  let contextItemCount = 0;
  let contextToggleDrawer: (() => void) | undefined = undefined;
  try {
    const cart = useCart();
    contextItemCount = cart.itemCount;
    contextToggleDrawer = cart.toggleDrawer;
  } catch {
    // Gracefully handle if Header is rendered outside CartProvider
  }

  const effectiveCartCount = cartItemCount ?? contextItemCount;
  const effectiveOnCartClick = onCartClick ?? contextToggleDrawer;

  // Scroll listener — add shadow + blur past 50 px
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialise on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onResize = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', onResize);
    return () => mq.removeEventListener('change', onResize);
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const handleMenuToggle = onMenuClick ?? toggleMobile;

  return (
    <>
      <header
        className={[
          'sticky top-0 z-sticky w-full transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.08)]'
            : 'bg-white',
        ].join(' ')}
      >
        <div className="container-main flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* ── Mobile: hamburger ─────────────────────────────────────────── */}
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={handleMenuToggle}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className={
              'lg:hidden p-2.5 -ml-1 rounded-lg text-neutral-600 min-h-[44px] min-w-[44px] flex items-center justify-center ' +
              'hover:bg-neutral-100 transition-colors duration-150 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
            }
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="McDaves — home"
            className={
              'font-semibold text-h4 text-brand-800 tracking-tight ' +
              'hover:text-brand-600 transition-colors duration-150 ' +
              'sm:absolute sm:left-1/2 sm:-translate-x-1/2 lg:static lg:translate-x-0 lg:left-auto'
            }
          >
            McDaves
          </Link>

          {/* ── Desktop navigation ────────────────────────────────────────── */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={
                  'px-3.5 py-2 rounded-lg text-body-sm font-medium text-neutral-600 ' +
                  'hover:text-brand-700 hover:bg-brand-50 ' +
                  'transition-colors duration-150 whitespace-nowrap ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── B2B Trade Link & Right controls ───────────────────────────── */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            {/* Prominent B2B Track entry point */}
            <Link
              href="/pro"
              className={
                'hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-full ' +
                'bg-neutral-900 text-white text-xs font-semibold tracking-wide ' +
                'hover:bg-neutral-800 transition-all duration-150 shadow-sm ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900'
              }
            >
              For Optical Professionals
            </Link>
            {/* Search — hidden on smallest screens, shown from sm */}
            <button
              id="header-search-btn"
              type="button"
              onClick={onSearchClick}
              aria-label="Search"
              className={
                'hidden sm:flex p-2.5 rounded-lg text-neutral-600 min-h-[44px] min-w-[44px] items-center justify-center ' +
                'hover:text-brand-700 hover:bg-neutral-100 ' +
                'transition-colors duration-150 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
              }
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Cart */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={effectiveOnCartClick}
              aria-label={
                effectiveCartCount > 0
                  ? `View cart — ${effectiveCartCount} item${effectiveCartCount !== 1 ? 's' : ''}`
                  : 'View cart'
              }
              className={
                'relative p-2.5 rounded-lg text-neutral-600 min-h-[44px] min-w-[44px] flex items-center justify-center ' +
                'hover:text-brand-700 hover:bg-neutral-100 ' +
                'transition-colors duration-150 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
              }
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />

              {/* Count badge */}
              {effectiveCartCount > 0 && (
                <span
                  aria-hidden="true"
                  className={
                    'absolute -top-0.5 -right-0.5 ' +
                    'min-w-[18px] h-[18px] px-1 ' +
                    'flex items-center justify-center ' +
                    'rounded-full bg-brand-600 text-white ' +
                    'text-[10px] font-bold leading-none ' +
                    'ring-2 ring-white'
                  }
                >
                  {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
