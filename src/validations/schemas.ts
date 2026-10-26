import { z } from "zod";
import { DIMENSION_UNITS } from "@/lib/constants";

/**
 * Zod schemas — the single validation source shared by API routes (server)
 * and admin forms (client). Errors surface as `VALIDATION_ERROR` with issue
 * paths so `<Input>` fields can bind messages.
 */

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(80),
  password: z.string().min(1, "Password is required").max(200),
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: slugSchema.optional(),
  description: optionalTrimmed(400),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "Provide at least one category"),
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const dimensionsSchema = z
  .object({
    width: z.number().min(0).max(100000).nullable().optional(),
    depth: z.number().min(0).max(100000).nullable().optional(),
    height: z.number().min(0).max(100000).nullable().optional(),
    unit: z.enum(DIMENSION_UNITS).default("cm"),
  })
  .optional()
  .nullable();

export const productImageInputSchema = z.object({
  id: z.string().optional(), // existing image id (when updating)
  imageKey: z.string().trim().min(1).max(500),
  altText: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isPrimary: z.boolean().optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(140),
  sku: z
    .string()
    .trim()
    .min(2, "SKU is required")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "SKU may only contain letters, numbers and hyphens"),
  slug: slugSchema.optional(),
  categoryId: z.string().min(1, "Choose a category"),
  shortDescription: optionalTrimmed(300),
  description: optionalTrimmed(8000),
  price: z.number().int().min(0).max(99_999_999).nullable().optional(),
  originalPrice: z.number().int().min(0).max(99_999_999).nullable().optional(),
  dimensions: dimensionsSchema,
  material: optionalTrimmed(160),
  finish: optionalTrimmed(160),
  colours: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "MADE_TO_ORDER"]).default("AVAILABLE"),
  deliveryInfo: optionalTrimmed(300),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seoTitle: optionalTrimmed(180),
  seoDescription: optionalTrimmed(320),
  images: z.array(productImageInputSchema).max(12).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().trim().max(60).optional(),
  categorySlug: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED"]).optional(),
  availability: z.enum(["ALL", "AVAILABLE", "UNAVAILABLE", "MADE_TO_ORDER"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "name-asc"]).optional(),
  page: z.coerce.number().int().min(1).max(9999).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).optional(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const socialLinksSchema = z
  .object({
    instagram: z.string().trim().max(300).optional(),
    facebook: z.string().trim().max(300).optional(),
    youtube: z.string().trim().max(300).optional(),
  })
  .optional();

export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(80),
  area: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1).max(600),
  rating: z.number().int().min(1).max(5),
});

export const heroStatSchema = z.object({
  value: z.string().trim().min(1, "Stat value is required (e.g. 27+)").max(24),
  label: z.string().trim().min(1, "Stat label is required").max(60),
});

export const settingsUpdateSchema = z
  .object({
    shopName: z.string().trim().min(2).max(120),
    tagline: z.string().trim().max(200),
    logoUrl: z.string().trim().max(500).nullable().optional(),
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^\d{10,15}$/, "WhatsApp number must be digits only, including country code (e.g. 919876543210)"),
    phone: z.string().trim().max(40),
    email: z.string().trim().email("Enter a valid email").max(160),
    address: z.string().trim().max(400),
    mapLink: z.string().trim().max(500),
    businessHours: z.string().trim().max(600),
    serviceAreas: z.string().trim().max(400),
    announcementText: optionalTrimmed(200),
    heroHeadline: z.string().trim().min(2).max(160),
    heroSubtitle: z.string().trim().max(400),
    heroImageUrl: z.string().trim().max(500).nullable().optional(),
    heroCtaText: z.string().trim().min(1).max(60),
    heroCtaLink: z.string().trim().max(200),
    heroStats: z.array(heroStatSchema).max(4, "Keep the hero strip to 4 stats").optional(),
    aboutTitle: z.string().trim().min(2).max(120),
    aboutStory: z.string().trim().max(6000),
    showroomImages: z.array(z.string().trim().max(500)).max(10).optional(),
    socialLinks: socialLinksSchema,
    testimonialsEnabled: z.boolean().optional(),
    testimonials: z.array(testimonialSchema).max(9).optional(),
    defaultSeoTitle: z.string().trim().max(180),
    defaultSeoDescription: z.string().trim().max(320),
  })
  .partial();

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const mediaAltUpdateSchema = z.object({
  altText: z.string().trim().max(300).nullable(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
