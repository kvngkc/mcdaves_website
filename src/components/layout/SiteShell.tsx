// src/components/layout/SiteShell.tsx
// Client wrapper that owns the mobile-nav open state, keeping layout.tsx a
// server component (required for Next.js Metadata exports).
'use client';

import React, { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { HeaderB2B } from './HeaderB2B';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CartDrawer } from '@/components/sections/CartDrawer';
import { useCart } from '@/hooks/useCart';

export interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { itemCount, toggleDrawer } = useCart();
  const pathname = usePathname();

  const isProTrack = pathname?.startsWith('/pro') || pathname?.startsWith('/services');

  const openMobileNav  = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <>
      {isProTrack ? (
        <HeaderB2B onMenuClick={openMobileNav} />
      ) : (
        <Header
          cartItemCount={itemCount}
          onCartClick={toggleDrawer}
          onMenuClick={openMobileNav}
          onSearchClick={() => { /* TODO: open search overlay */ }}
        />
      )}

      {/* Mobile nav — rendered outside <header> so it can overlay the whole page */}
      <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />

      {/* Main Page Content */}
      <main className="flex-1 pb-12">{children}</main>

      {/* Cart Drawer — fixed slide-in drawer */}
      <CartDrawer />

      <Footer />

      <WhatsAppButton />
    </>
  );
}

export default SiteShell;
