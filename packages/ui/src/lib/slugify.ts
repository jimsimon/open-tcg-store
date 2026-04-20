/**
 * Convert a string to a URL-friendly slug.
 *
 * A short random suffix is appended to guarantee uniqueness when the slug is
 * used as a database identifier (e.g. Better Auth organisation slug).
 */
export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.random().toString(36).substring(2, 8);
  return base ? `${base}-${suffix}` : suffix;
}
