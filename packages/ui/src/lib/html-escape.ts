/**
 * Escapes a string for safe interpolation into HTML attribute values.
 * Prevents XSS when embedding user-controlled data in server-rendered templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
