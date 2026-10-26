import type { Category, Product, ProductImage, SiteSetting } from "@prisma/client";
import {
  DEFAULT_HERO_STATS,
  type CategoryDto,
  type HeroStat,
  type ProductAvailability,
  type ProductDto,
  type ProductImageDto,
  type ProductStatus,
  type SiteSettingsDto,
  type SocialLinks,
  type Testimonial,
} from "@/types";

/**
 * Entity → DTO mappers. Keeping these in one module guarantees every API
 * route and page serialises catalogue data identically (e.g. colours arrive
 * as arrays, dimensions as a single object, images ordered consistently).
 */

export function toProductImageDto(image: ProductImage): ProductImageDto {
  return {
    id: image.id,
    imageKey: image.imageKey,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  };
}

interface ProductWithRelations extends Product {
  category?: Pick<Category, "name" | "slug"> | null;
  images?: ProductImage[];
}

export function toProductDto(product: ProductWithRelations): ProductDto {
  const images = (product.images ?? [])
    .slice()
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    })
    .map(toProductImageDto);

  let colours: string[] = [];
  try {
    const parsed = product.colours ? (JSON.parse(product.colours) as unknown) : [];
    if (Array.isArray(parsed)) colours = parsed.map(String).filter(Boolean);
  } catch {
    colours = [];
  }

  const hasDimensions =
    product.dimensionWidth !== null ||
    product.dimensionDepth !== null ||
    product.dimensionHeight !== null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: product.category?.name,
    categorySlug: product.category?.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    dimensions: hasDimensions
      ? {
          width: product.dimensionWidth,
          depth: product.dimensionDepth,
          height: product.dimensionHeight,
          unit: product.dimensionUnit,
        }
      : null,
    material: product.material,
    finish: product.finish,
    colours,
    availability: product.availability as ProductAvailability,
    deliveryInfo: product.deliveryInfo,
    isFeatured: product.isFeatured,
    status: product.status as ProductStatus,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    images,
    primaryImage: images[0] ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toCategoryDto(
  category: Category & { _count?: { products: number } },
): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count?.products,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function parseJsonArray<T>(raw: string | null | undefined, guard: (value: unknown) => value is T): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(guard) : [];
  } catch {
    return [];
  }
}

export function parseTestimonials(raw: string | null): Testimonial[] {
  return parseJsonArray<Testimonial>(raw, (value): value is Testimonial => {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.name === "string" && typeof candidate.text === "string";
  });
}

export function parseHeroStats(raw: string | null): HeroStat[] {
  // Never saved → show the designed defaults. Saved but emptied → hide the strip.
  if (raw === null || raw === undefined) return DEFAULT_HERO_STATS;
  return parseJsonArray<HeroStat>(raw, (value): value is HeroStat => {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.value === "string" && typeof candidate.label === "string";
  });
}

export function parseSocialLinks(raw: string | null): SocialLinks {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const links: SocialLinks = {};
    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate.instagram === "string") links.instagram = candidate.instagram;
    if (typeof candidate.facebook === "string") links.facebook = candidate.facebook;
    if (typeof candidate.youtube === "string") links.youtube = candidate.youtube;
    return links;
  } catch {
    return {};
  }
}

export function toSettingsDto(settings: SiteSetting): SiteSettingsDto {
  return {
    shopName: settings.shopName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    whatsappNumber: settings.whatsappNumber,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    mapLink: settings.mapLink,
    businessHours: settings.businessHours,
    serviceAreas: settings.serviceAreas,
    announcementText: settings.announcementText,
    heroHeadline: settings.heroHeadline,
    heroSubtitle: settings.heroSubtitle,
    heroImageUrl: settings.heroImageUrl,
    heroCtaText: settings.heroCtaText,
    heroCtaLink: settings.heroCtaLink,
    heroStats: parseHeroStats(settings.heroStats),
    aboutTitle: settings.aboutTitle,
    aboutStory: settings.aboutStory,
    showroomImages: parseJsonArray<string>(settings.showroomImages, (v): v is string => typeof v === "string"),
    socialLinks: parseSocialLinks(settings.socialLinks),
    testimonialsEnabled: settings.testimonialsEnabled,
    testimonials: parseTestimonials(settings.testimonials),
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultSeoDescription: settings.defaultSeoDescription,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
