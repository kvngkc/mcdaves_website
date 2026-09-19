// src/components/layout/MobileNav.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ChevronRight, MessageCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  /** WhatsApp phone number (digits only, with country code, no +) */
  whatsappNumber?: string;
  whatsappMessage?: string;
}

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Shop',           href: '/shop',        desc: 'Browse our consumer eyewear collection' },
  { label: 'Our Story',      href: '/our-story',   desc: 'Optical heritage & precision craftsmanship' },
  { label: 'Contact',        href: '/contact',     desc: 'Get in touch with our Lagos team' },
  { label: 'FAQ',            href: '/faq',         desc: 'Common questions answered' },
] as const;

// ─── Focusable query ─────────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

import { siteConfig } from '@/data/site-config';

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileNav({
  open,
  onClose,
  whatsappNumber = siteConfig.whatsappNumber,
  whatsappMessage = "Hi McDaves! I'd like help choosing the right eyewear or lenses.",
}: MobileNavProps) {
  const drawerRef  = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management & focus trap
  useEffect(() => {
    if (!open) return;

    // Move focus to close button on open
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());

    function trapFocus(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', trapFocus);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', trapFocus);
    };
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-[70] bg-neutral-900/50 backdrop-blur-sm lg:hidden',
          'transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      <div
        id="mobile-nav"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          // z-[80]: above Modal backdrop (z-[70]) so nav always takes priority
          'fixed top-0 right-0 bottom-0 z-[80] w-full max-w-sm',
          'flex flex-col bg-white lg:hidden',
          'shadow-[-4px_0_24px_rgba(0,0,0,0.12)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <Link
            href="/"
            onClick={onClose}
            className="font-semibold text-h4 text-brand-800 tracking-tight"
          >
            McDaves
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className={
              'p-2.5 rounded-lg text-neutral-500 min-h-[44px] min-w-[44px] flex items-center justify-center ' +
              'hover:text-neutral-800 hover:bg-neutral-100 ' +
              'transition-colors duration-150 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
            }
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Nav links ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto py-3 space-y-4"
        >
          {/* ── Optical Supplies Mobile Banner ────────────────────────────── */}
          <div className="px-4">
            <Link
              href="/pro"
              onClick={onClose}
              className={
                'flex items-center justify-between p-3.5 rounded-xl ' +
                'bg-neutral-900 text-white ' +
                'hover:bg-neutral-800 transition-colors duration-150 group'
              }
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300 uppercase tracking-wider mb-1">
                  Optical Supplies
                </span>
                <p className="font-semibold text-body-sm leading-snug">McDaves Optical Supplies</p>
                <p className="text-caption text-neutral-400 mt-0.5">Finished lenses, surfacing blanks & optical care</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>
          </div>

          <ul role="list" className="divide-y divide-neutral-50 border-t border-b border-neutral-100">
            {NAV_LINKS.map(({ label, href, desc }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={
                    'flex items-center justify-between px-5 py-3.5 min-h-[44px] ' +
                    'text-neutral-800 hover:bg-brand-50 hover:text-brand-700 ' +
                    'transition-colors duration-150 group ' +
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500'
                  }
                >
                  <div>
                    <p className="font-medium text-body-sm leading-snug">{label}</p>
                    <p className="text-caption text-neutral-400 mt-0.5 group-hover:text-brand-500 transition-colors">
                      {desc}
                    </p>
                  </div>
                  <ChevronRight
                    className={
                      'w-4 h-4 text-neutral-300 flex-shrink-0 ml-3 ' +
                      'group-hover:text-brand-500 group-hover:translate-x-0.5 ' +
                      'transition-all duration-150'
                    }
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Footer: WhatsApp CTA ──────────────────────────────────────── */}
        <div className="px-5 py-5 pb-safe border-t border-neutral-100 bg-neutral-50/60">
          <a
            id="mobile-nav-whatsapp-cta"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={
              'flex items-center justify-center gap-2.5 w-full ' +
              'py-3.5 px-5 rounded-xl ' +
              'bg-[#25D366] text-white font-semibold text-body-sm ' +
              'hover:bg-[#1ebe5d] active:bg-[#17a852] ' +
              'transition-all duration-200 active:scale-[0.98] ' +
              'shadow-sm hover:shadow-md ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2'
            }
          >
            {/* WhatsApp SVG icon (no external dep) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <MessageCircle className="w-5 h-5 flex-shrink-0 hidden" aria-hidden="true" />
            Chat with us on WhatsApp
          </a>
          <p className="text-center text-caption text-neutral-400 mt-3">
            Usually replies within minutes
          </p>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
