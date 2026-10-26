/**
 * Shared DTO types used by services, API routes and UI components.
 *
 * These describe the wire format of the API (snake-free, camelCase) rather
 * than raw Prisma rows, so the UI never depends on ORM internals.
 */

export type ProductStatus = "DRAFT" | "PUBLISHED";
export type ProductAvailability = "AVAILABLE" | "UNAVAILABLE" | "MADE_TO_ORDER";

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageDto {
  id: string;
  imageKey: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  originalPrice: number | null;
  dimensions: {
    width: number | null;
    depth: number | null;
    height: number | null;
    unit: string;
  } | null;
  material: string | null;
  finish: string | null;
  colours: string[];
  availability: ProductAvailability;
  deliveryInfo: string | null;
  isFeatured: boolean;
  status: ProductStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImageDto[];
  primaryImage: ProductImageDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  status?: ProductStatus | "ALL";
  availability?: ProductAvailability | "ALL";
  featured?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Testimonial {
  name: string;
  area: string;
  text: string;
  rating: number; // 1..5
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

/** One entry of the stat strip under the homepage hero (CMS-editable). */
export interface HeroStat {
  value: string; // e.g. "27+"
  label: string; // e.g. "Years of craftsmanship"
}

/** Shown whenever no stats have been saved yet (fresh install / pre-migration rows). */
export const DEFAULT_HERO_STATS: HeroStat[] = [
  { value: "27+", label: "Years of craftsmanship" },
  { value: "6,000+", label: "Homes furnished" },
  { value: "100%", label: "Seasoned solid wood" },
  { value: "4.9★", label: "Customer rating" },
];

export interface SiteSettingsDto {
  shopName: string;
  tagline: string;
  logoUrl: string | null;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  mapLink: string;
  businessHours: string;
  serviceAreas: string;
  announcementText: string | null;
  heroHeadline: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  heroCtaText: string;
  heroCtaLink: string;
  heroStats: HeroStat[];
  aboutTitle: string;
  aboutStory: string;
  showroomImages: string[];
  socialLinks: SocialLinks;
  testimonialsEnabled: boolean;
  testimonials: Testimonial[];
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  updatedAt: string;
}

/** Shape returned by GET /api/auth/session. */
export interface SessionDto {
  authenticated: boolean;
  user: { username: string; name: string } | null;
}

export interface DashboardStatsDto {
  totalProducts: number;
  published: number;
  drafts: number;
  unavailable: number;
  categories: number;
  mediaCount: number;
  recentProducts: Array<{
    id: string;
    name: string;
    sku: string;
    status: ProductStatus;
    updatedAt: string;
  }>;
}
