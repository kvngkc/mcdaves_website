// src/components/layout/WhatsAppButton.tsx
'use client';

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppButtonProps {
  /** WhatsApp phone number — digits only, with country code, no '+' */
  phoneNumber?: string;
  /** Pre-filled message */
  message?: string;
  /** aria-label override */
  label?: string;
}

// ─── WhatsApp SVG (self-contained, no extra deps) ────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** localStorage key to track whether the pulse has already been shown */
const PULSE_SEEN_KEY = 'mcdaves_wa_pulse_seen';

/** How long the pulse plays before stopping (ms) */
const PULSE_DURATION = 3000;

import { siteConfig } from '@/data/site-config';

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsAppButton({
  phoneNumber = siteConfig.whatsappNumber,
  message = "Hi McDaves! I'd like help choosing the right eyewear or lenses.",
  label = 'Chat with us on WhatsApp',
}: WhatsAppButtonProps) {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    // Only pulse on first visit
    try {
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(PULSE_SEEN_KEY)) {
        setPulsing(true);
        const timer = setTimeout(() => {
          setPulsing(false);
          localStorage.setItem(PULSE_SEEN_KEY, '1');
        }, PULSE_DURATION);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable (SSR / private browsing) — just skip
    }
  }, []);

  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <>
      {/* ── Keyframe injected once ─────────────────────────────────────── */}
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
          50%       { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
        }
        .wa-pulse { animation: wa-pulse 1.4s ease-in-out 3; }
      `}</style>

      <a
        id="whatsapp-floating-btn"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        className={[
          /* Layout — bottom set via style above for safe-area-inset support */
          'fixed right-5 z-floating',
          'flex items-center justify-center',
          'w-14 h-14 rounded-full',
          /* Colour */
          'bg-[#25D366] text-white',
          /* Shadow */
          'shadow-[0_4px_16px_rgba(37,211,102,0.45)]',
          /* Hover & active */
          'hover:scale-105 hover:shadow-[0_6px_24px_rgba(37,211,102,0.55)]',
          'active:scale-100',
          /* Transition */
          'transition-all duration-200 ease-out',
          /* Focus */
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2',
          /* Conditional pulse */
          pulsing ? 'wa-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </>
  );
}

export default WhatsAppButton;
