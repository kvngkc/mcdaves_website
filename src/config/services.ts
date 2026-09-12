// src/config/services.ts
/**
 * Canonical Services, Delivery, & Policy Single Source of Truth (SSOT).
 * Defines standardized delivery pricing, turnaround times, and customer guarantees.
 */

export const deliveryConfig = {
  // Standard Delivery Fees
  standardFee: 2500,
  freeThreshold: 50000,
  lagosPickupFee: 0,

  // Standard Delivery Timelines
  timelines: {
    lagosDelivery: '2–5 business days',
    nationwideDelivery: '5–10 business days',
    lagosPickup: '1–2 business days',
    displaySummary: '2–5 business days in Lagos; 5–10 business days nationwide',
  },

  // Pickup Location Details
  pickupLocation: {
    name: 'McDaves Central Optical Hub',
    address: '4, Nnamdi Azikiwe Street, Lagos, Nigeria',
    instructions: 'Ready for collection within 1–2 business days after order confirmation.',
  },

  // Standard Delivery Zones
  zones: [
    { id: 'lagos_mainland', label: 'Lagos Mainland (24-48 hrs)', fee: 2500 },
    { id: 'lagos_island', label: 'Lagos Island / Lekki / VI (24-48 hrs)', fee: 3000 },
    { id: 'outside_lagos', label: 'Nationwide Delivery (3-5 days)', fee: 5000 },
  ]
} as const;

export const serviceConfig = {
  // Prescription Lens Replacement
  lensReplacement: {
    pricingMode: 'custom_quote',
    turnaround: {
      standard: '2–5 business days',
      displaySummary: 'Fast 2–5 business day turnaround with precision optical glazing',
    },
    tiers: [
      {
        id: 'single_vision_clear',
        name: 'Single Vision Clear',
        desc: 'Standard distance or reading lenses with anti-reflective coating for crisp, glare-free vision.',
        badge: 'Everyday Essential',
      },
      {
        id: 'blue_cut',
        name: 'Blue Cut (Digital Protection)',
        desc: 'Filters high-energy blue light from computer screens, phones, and indoor LED lighting.',
        badge: 'Screen Protection',
      },
      {
        id: 'photochromic',
        name: 'Photochromic (Light-Adaptive)',
        desc: 'Clear indoors, automatically adapts to sunglasses tint when exposed to outdoor UV sunlight.',
        badge: 'All-Day Versatility',
      },
      {
        id: 'polycarbonate_high_index',
        name: 'Polycarbonate / High-Index',
        desc: 'Ultra-thin, impact-resistant, lightweight lenses ideal for higher prescription powers.',
        badge: 'Thin & Impact-Resistant',
      },
      {
        id: 'progressive',
        name: 'Progressive / Multifocal',
        desc: 'Seamless near, intermediate, and distance vision without visible bifocal dividing lines.',
        badge: 'Seamless Multifocal',
      },
    ],
  },

  // Sightly Consumer Collection Overview
  sightlyCollection: {
    tagline: 'See well. Look better. Pay right.',
    priceRange: '₦30,000 – ₦80,000',
    description: 'Mid-premium fashion frames for the modern Nigerian. Expertly fitted. Generationally trusted.',
  },

  // Policies & Warranties
  policies: {
    frameReturnDays: 7,
    lensRemakeDays: 14,
    frameReturnText: 'Unworn frames in original condition may be returned within 7 days of delivery for exchange or store credit. Return shipping is the customer\'s responsibility.',
    lensRemakeText: 'If lenses are incorrectly fitted or do not match your verified prescription, we will remake them free of charge within 14 days. Frame damage during lens fitting is covered by our workmanship warranty.',
    workmanshipGuaranteeTitle: 'Workmanship Warranty',
    workmanshipGuaranteeText: 'Every lens is surfaced and checked to exact optical tolerances in Lagos. Complete remake coverage if lenses do not match your verified prescription.',
  },
} as const;
