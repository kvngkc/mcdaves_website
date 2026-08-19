// src/data/site-config.ts
/**
 * Global site configuration bridge.
 * Sourced directly from the canonical Single Source of Truth (SSOT) in @/config.
 */

import { businessIdentity } from '@/config/business';
import { deliveryConfig, serviceConfig } from '@/config/services';
import { urlConfig } from '@/config/urls';

export const siteConfig = {
  // Brand
  name: businessIdentity.brandName,
  tagline: businessIdentity.tagline,
  url: urlConfig.productionBaseUrl,

  // Contact
  whatsappNumber: businessIdentity.contact.rawWhatsApp,
  phoneNumber: businessIdentity.contact.rawPhone,
  displayPhone: businessIdentity.contact.displayPhone,
  email: businessIdentity.contact.email,
  address: businessIdentity.contact.address.shortAddress,
  fullAddress: businessIdentity.contact.address.fullAddress,
  hours: businessIdentity.hours.regular.display,

  // Story
  founded: businessIdentity.foundedDisplay,
  foundedYear: String(businessIdentity.foundedYear),

  // Social
  social: {
    instagram: businessIdentity.social.instagram,
    facebook: businessIdentity.social.facebook,
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
    frames: serviceConfig.policies.frameReturnText,
    lenses: serviceConfig.policies.lensRemakeText,
  },

  // Delivery
  delivery: {
    nationwide: true,
    lagosPickup: true,
    standardFee: deliveryConfig.standardFee,
    freeThreshold: deliveryConfig.freeThreshold,
    timeline: deliveryConfig.timelines.displaySummary,
  },

  // Sightly Collection
  sightly: {
    tagline: serviceConfig.sightlyCollection.tagline,
    priceRange: serviceConfig.sightlyCollection.priceRange,
    description: serviceConfig.sightlyCollection.description,
  },
} as const;

export default siteConfig;
