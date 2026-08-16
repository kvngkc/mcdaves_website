// src/components/layout/HeaderB2B.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, ExternalLink, ArrowUpRight } from 'lucide-react';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';

export interface HeaderB2BProps {
  onMenuClick?: () => void;
}

const B2B_NAV_LINKS = [
  { label: 'Optical Products', href: '/pro/catalog' },
  { label: 'Lens Replacement', href: '/services/lens-replacement' },
  { label: 'Ordering Guide',   href: '/pro/how-it-works' },
  { label: 'Contact',          href: '/contact' },
] as const;

export function HeaderB2B({ onMenuClick }: HeaderB2BProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const handleMenuToggle = onMenuClick ?? toggleMobile;

  return (
    <header
      className={[
        'sticky top-0 z-sticky w-full transition-all duration-300 border-b border-neutral-800',
        'bg-neutral-900 text-white',
        scrolled ? 'shadow-md bg-neutral-950/95 backdrop-blur-md' : '',
      ].join(' ')}
    >
      <div className="container-main flex items-center justify-between h-16 gap-2 sm:gap-4">
        {/* Mobile: Hamburger */}
        <button
          type="button"
          onClick={handleMenuToggle}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className={
            'lg:hidden p-2.5 -ml-1 rounded-lg text-neutral-300 min-h-[44px] min-w-[44px] flex items-center justify-center ' +
            'hover:bg-neutral-800 transition-colors duration-150 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
          }
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* Logo & Optical Supplies Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/pro"
            aria-label="McDaves Optical Supplies Home"
            className="font-bold text-h4 tracking-tight text-white hover:text-neutral-200 transition-colors"
          >
            McDaves <span className="font-light text-brand-400">Optical</span>
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 tracking-wider uppercase">
            Lenses & Materials
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav aria-label="B2B navigation" className="hidden lg:flex items-center gap-1">
          {B2B_NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={
                'px-3 py-2 rounded-lg text-body-sm font-medium text-neutral-300 ' +
                'hover:text-white hover:bg-neutral-800 ' +
                'transition-colors duration-150 whitespace-nowrap ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
              }
            >
              {label}
            </Link>
          ))}
          <a
            href={ORDERING_SYSTEM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-body-sm font-medium text-brand-400 hover:text-brand-300 hover:bg-neutral-800 transition-colors duration-150 inline-flex items-center gap-1"
          >
            <span>Order Online</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Right CTAs: Cross-track Consumer Link & Order CTA */}
        <div className="flex items-center gap-3 ml-auto lg:ml-0">
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1"
          >
            <span>Frames Collection</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <a
            href={ORDERING_SYSTEM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ' +
              'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 ' +
              'transition-colors duration-150 shadow-sm ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
            }
          >
            <span>Order Online</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default HeaderB2B;
