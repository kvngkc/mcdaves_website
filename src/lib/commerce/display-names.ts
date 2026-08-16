// src/lib/commerce/display-names.ts
/**
 * Customer-Facing Product Name Presentation Formatter
 * 
 * Non-destructively maps canonical abbreviations from authoritative catalog ('all products.xlsx')
 * to clear, customer-friendly display names without altering underlying catalog IDs or data models.
 */

const TOKEN_REPLACEMENTS: Record<string, string> = {
  'S/V': 'Single Vision',
  'B/C': 'Blue Cut',
  'P/C': 'Polycarbonate',
  'P/B': 'Poly Blue',
  'INV': 'Invisible',
  'INV.': 'Invisible',
  'VTR': 'Var Photo',
  'ORDER': 'Special Order',
  'PHOTO': 'Photo',
};

/**
 * Transforms a canonical catalog product name into a clear, customer-friendly display name.
 * Examples:
 * - "S/V AR" -> "Single Vision AR"
 * - "S/V B/C" -> "Single Vision Blue Cut"
 * - "S/V PHOTO" -> "Single Vision Photo"
 * - "P/C PHOTO" -> "Polycarbonate Photo"
 * - "B/C PHOTO P/C" -> "Blue Cut Photo Polycarbonate"
 * - "S/V P/B" -> "Single Vision Poly Blue"
 * - "INV AR" -> "Invisible AR"
 * - "INV. PHOTO" -> "Invisible Photo"
 * - "VTR B/C" -> "Var Photo Blue Cut"
 * - "VTR P/B" -> "Var Photo Poly Blue"
 * - "VTR P/C" -> "Var Photo Polycarbonate"
 * - "VTR ORDER" -> "Var Photo Special Order"
 * - "FUSE PHOTO ORDER" -> "FUSE Photo Special Order"
 * - "FUSE WTE ORDER" -> "FUSE WTE Special Order"
 * - "VAR WTE ORDER" -> "VAR WTE Special Order"
 */
export function formatCustomerFacingProductName(canonicalName: string): string {
  if (!canonicalName) return '';

  const tokens = canonicalName.trim().split(/\s+/);

  const formattedTokens = tokens.map((token) => {
    // Exact token match
    if (TOKEN_REPLACEMENTS[token]) {
      return TOKEN_REPLACEMENTS[token];
    }
    // Case-insensitive token match
    const upper = token.toUpperCase();
    if (TOKEN_REPLACEMENTS[upper]) {
      return TOKEN_REPLACEMENTS[upper];
    }
    return token;
  });

  return formattedTokens.join(' ');
}
