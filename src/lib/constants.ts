/**
 * Application-wide constants.
 *
 * Values that appear in more than one layer (upload limits, image ratios,
 * catalogue page sizes, price formatting) live here so the UI, API and
 * services never drift apart.
 */

export const SITE = {
  /** Fallback when the CMS has no shop name yet. */
  fallbackName: "SK Furniture",
} as const;

export const CATALOGUE = {
  pageSize: 9,
  relatedProducts: 4,
  sortOptions: [
    { value: "newest", label: "Newest first" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "name-asc", label: "Name: A to Z" },
  ],
} as const;

export const PRODUCT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;

export const PRODUCT_AVAILABILITY = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  MADE_TO_ORDER: "MADE_TO_ORDER",
} as const;

export const DIMENSION_UNITS = ["cm", "inch", "feet"] as const;

export const MEDIA_TYPES = {
  allowed: ["image/jpeg", "image/png", "image/webp"] as string[],
  maxDimensionPx: 2400, // longest edge after optimisation
  webpQuality: 82,
  /** Recommended ratios surfaced in the CMS uploader (from the PRD). */
  guidance: [
    { label: "Product cards", ratio: "4:5", size: "1200 × 1500 px" },
    { label: "Hero desktop", ratio: "16:9", size: "1920 × 1080 px" },
    { label: "Hero mobile", ratio: "4:5", size: "1080 × 1350 px" },
    { label: "Category tiles", ratio: "1:1", size: "1000 × 1000 px" },
    { label: "Showroom photos", ratio: "4:3", size: "1200 × 900 px" },
    { label: "Social sharing", ratio: "1.91:1", size: "1200 × 630 px" },
  ],
} as const;

export const MEDIA_MAX_BYTES = 8 * 1024 * 1024; // 8 MB pre-optimisation ceiling

export const UPLOAD_FOLDERS = ["products", "banners", "showroom", "misc"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Format whole-INR prices for display. `null` means "enquire for price". */
export function formatPrice(amount?: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
