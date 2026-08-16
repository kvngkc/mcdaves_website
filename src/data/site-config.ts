// src/data/site-config.ts
// Global site configuration — edit this file to update business details across the entire site

export const siteConfig = {
  // Brand
  name: 'McDaves',
  tagline: 'Two Generations of Optical Precision',
  url: 'https://mcdaves.com.ng',

  // Contact
  whatsappNumber: '2348152346649', // International format, no +
  phoneNumber: '2348152346649',
  email: 'mcdavesopticals@gmail.com',
  address: '4, Nnamdi Azikwe Street, Lagos, Nigeria',
  hours: 'Monday – Friday, 9:00 AM – 5:00 PM',

  // Story
  founded: 'Over two decades',
  foundedYear: '1997',

  // Social
  social: {
    instagram: 'https://instagram.com/mcdavesoptical',
    facebook: 'https://facebook.com/mcdavesoptical',
  },

  // Payments
  paystack: {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  },

  // Analytics
  analytics: {
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID || '',
  },

  // Policies
  returnPolicy: {
    frames: 'Unworn frames in original condition may be returned within 7 days of delivery for exchange or store credit. Return shipping is the customer\'s responsibility.',
    lenses: 'If lenses are incorrectly fitted or do not match your verified prescription, we will remake them free of charge within 14 days. Frame damage during lens fitting is covered by our workmanship guarantee.',
  },

  // Delivery
  delivery: {
    nationwide: true,
    lagosPickup: true,
    standardFee: 2500,
    freeThreshold: 50000, // Free delivery above this amount
    timeline: '2–5 business days (Lagos), 5–10 business days (nationwide)',
  },

  // Sightly Collection
  sightly: {
    tagline: 'See well. Look better. Pay right.',
    priceRange: '₦30,000 – ₦80,000',
    description: 'Mid-premium fashion frames for the modern Nigerian. Expertly fitted. Generationally trusted.',
  },
} as const;
