/**
 * URL-slug generation — shared by the product service (server) and the
 * admin forms (client), so the CMS preview always matches what the API
 * stores.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
}
