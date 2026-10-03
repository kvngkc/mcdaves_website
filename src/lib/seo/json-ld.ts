/**
 * Serialises a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json">` block.
 *
 * Escapes `<` as `\u003c` so that a `</script>` sequence (or any other markup)
 * contained in the data can never terminate the script element early. This is
 * applied consistently to every JSON-LD block in the app so the markup stays
 * safe if the data ever becomes dynamic.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
