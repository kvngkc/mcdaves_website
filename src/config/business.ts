// src/config/business.ts
/**
 * Canonical Business Identity & Contact Single Source of Truth (SSOT).
 * All pages, components, footers, checkout flows, and JSON-LD schemas
 * must consume contact information and business identity from this file.
 */

export interface StructuredAddress {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
  fullAddress: string;
  shortAddress: string;
}

export interface OperatingHours {
  days: string;
  open: string;
  close: string;
  display: string;
  daysOfWeek: string[];
  opens: string;
  closes: string;
}

export const businessIdentity = {
  // Legal & Brand Identity
  legalName: 'McDaves Optical Supplies Limited',
  brandName: 'McDaves',
  tradeName: 'McDaves Optical',
  consumerBrand: 'Sightly',
  b2bBrand: 'McDaves Pro',
  b2bDivision: 'McDaves Optical Supplies',
  tagline: 'Two Generations of Optical Precision',
  
  // Heritage
  foundedYear: 1997,
  foundedDisplay: 'Over two decades',
  heritageStory: 'Two generations of optical precision in Lagos, Nigeria supplying ophthalmic materials, prescription lenses, and Sightly premium eyewear.',

  // Verified Contact Details
  contact: {
    // International digits only (for WhatsApp and tel links)
    rawPhone: '2348152346649',
    rawWhatsApp: '2348152346649',
    
    // Formatted for human display
    displayPhone: '+234 815 234 6649',
    localPhone: '0815 234 6649',
    
    // Official Email
    email: 'mcdavesopticals@gmail.com',

    // Official Physical Address (Lagos Hub)
    address: {
      streetAddress: '4, Nnamdi Azikiwe Street',
      addressLocality: 'Lagos Island',
      addressRegion: 'Lagos State',
      addressCountry: 'NG',
      fullAddress: '4, Nnamdi Azikiwe Street, Lagos Island, Lagos, Nigeria',
      shortAddress: '4, Nnamdi Azikiwe Street, Lagos, Nigeria',
    } as StructuredAddress,

    // Geo Coordinates (Lagos Island commercial district)
    geo: {
      latitude: 6.4549,
      longitude: 3.3886,
    },
  },

  // Operating Hours
  hours: {
    regular: {
      days: 'Monday – Friday',
      open: '09:00',
      close: '17:00',
      display: 'Monday – Friday, 9:00 AM – 5:00 PM',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    } as OperatingHours,
    // Note: Saturday inquiries handled via WhatsApp asynchronously
  },

  // Social Media Channels
  social: {
    instagram: 'https://instagram.com/mcdavesoptical',
    facebook: 'https://facebook.com/mcdavesoptical',
    whatsapp: 'https://wa.me/2348152346649',
  },
} as const;

/**
 * Returns a standardized WhatsApp link with contextual pre-filled message.
 */
export function getWhatsAppUrl(customMessage?: string): string {
  const defaultMsg = "Hi McDaves! I'd like help choosing the right eyewear or lenses.";
  const msg = customMessage || defaultMsg;
  return `https://wa.me/${businessIdentity.contact.rawWhatsApp}?text=${encodeURIComponent(msg)}`;
}
