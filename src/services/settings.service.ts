import { db } from "@/lib/db";
import { describeDbError, isDbUnavailable } from "@/lib/db-health";
import { DEFAULT_HERO_STATS } from "@/types";
import type { SiteSettingsDto } from "@/types";
import type { SettingsUpdateInput } from "@/validations/schemas";
import { toSettingsDto } from "./mappers";

/**
 * Site settings service — the singleton row powers branding, contact
 * details, hero content and default SEO. A row is lazily created so the
 * site renders correctly even before the admin saves settings once.
 *
 * If the database is unreachable or has not been migrated yet (e.g. a fresh
 * production database before `db:push` + seed), public reads fall back to
 * branded defaults instead of crashing every page. Admin writes still
 * surface the real error so configuration problems get fixed, not masked.
 */

const SETTINGS_ID = "default";

/** Mirrors scripts/seed.ts — used only when the database is unavailable. */
const FALLBACK_SETTINGS: SiteSettingsDto = {
  shopName: "SK Furniture",
  tagline: "Timeless solid wood furniture, crafted in Mumbai since 1998",
  logoUrl: null,
  whatsappNumber: "919876543210",
  phone: "+91 98765 43210",
  email: "hello@skfurniture.in",
  address: "Shop 12, Furniture Market, MG Road, Mumbai, Maharashtra 400001",
  mapLink: "https://maps.google.com/?q=MG+Road+Furniture+Market+Mumbai",
  businessHours: "Mon – Sat: 10:00 AM – 8:30 PM\nSunday: 11:00 AM – 6:00 PM",
  serviceAreas: "Mumbai · Thane · Navi Mumbai · Pune (delivery)",
  announcementText: null,
  heroHeadline: "Furniture That Turns a House Into a Home",
  heroSubtitle:
    "Handcrafted sofas, beds, wardrobes and dining sets — built from seasoned solid wood by artisans with 20+ years of experience. Visit our showroom or enquire directly on WhatsApp.",
  heroImageUrl: null,
  heroCtaText: "Explore Collection",
  heroCtaLink: "/catalogue",
  heroStats: DEFAULT_HERO_STATS,
  aboutTitle: "Craftsmanship You Can Feel",
  aboutStory:
    "SK Furniture began in 1998 as a two-carpenter workshop in Mumbai. Today, our 25-member team furnishes hundreds of homes across Maharashtra.\n\nWe build with seasoned sheesham, teak and mango wood — never particle board pretending to be more. Every piece passes three quality checks before delivery, and our artisans sign the furniture they build.\n\nVisit our 4,000 sq ft showroom to sink into the cushions and feel the grain for yourself, or send us your floor plan on WhatsApp and we will design furniture around your space.",
  showroomImages: [],
  socialLinks: { instagram: "https://instagram.com/skfurniture", facebook: "https://facebook.com/skfurniture" },
  testimonialsEnabled: true,
  testimonials: [],
  defaultSeoTitle: "SK Furniture — Premium Solid Wood Furniture in Mumbai",
  defaultSeoDescription:
    "Buy sofas, beds, wardrobes, dining sets and custom solid wood furniture in Mumbai. Free delivery, 5-year workmanship warranty. Enquire on WhatsApp today.",
  updatedAt: new Date(0).toISOString(),
};

export async function getSettings(): Promise<SiteSettingsDto> {
  try {
    // Upsert (not find-then-create) so concurrent cold-start requests cannot
    // race into a unique-constraint violation on the singleton id.
    const settings = await db.siteSetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
    return toSettingsDto(settings);
  } catch (error) {
    if (isDbUnavailable(error)) {
      // Fresh/unmigrated database or unreachable server — keep the public
      // site online with default branding. The real cause is logged and
      // reported by GET /api/health.
      console.error(`[settings] database unavailable, serving defaults — ${describeDbError(error)}`);
      return FALLBACK_SETTINGS;
    }
    throw error;
  }
}

/** Raw row for internal server usage (e.g. sitemap, WhatsApp number lookups). */
export async function getSettingsRow() {
  return db.siteSetting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export async function updateSettings(input: SettingsUpdateInput): Promise<SiteSettingsDto> {
  const data = {
    ...(input.shopName !== undefined ? { shopName: input.shopName } : {}),
    ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.whatsappNumber !== undefined ? { whatsappNumber: input.whatsappNumber } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.mapLink !== undefined ? { mapLink: input.mapLink } : {}),
    ...(input.businessHours !== undefined ? { businessHours: input.businessHours } : {}),
    ...(input.serviceAreas !== undefined ? { serviceAreas: input.serviceAreas } : {}),
    ...(input.announcementText !== undefined ? { announcementText: input.announcementText } : {}),
    ...(input.heroHeadline !== undefined ? { heroHeadline: input.heroHeadline } : {}),
    ...(input.heroSubtitle !== undefined ? { heroSubtitle: input.heroSubtitle } : {}),
    ...(input.heroImageUrl !== undefined ? { heroImageUrl: input.heroImageUrl } : {}),
    ...(input.heroCtaText !== undefined ? { heroCtaText: input.heroCtaText } : {}),
    ...(input.heroCtaLink !== undefined ? { heroCtaLink: input.heroCtaLink } : {}),
    ...(input.heroStats !== undefined ? { heroStats: JSON.stringify(input.heroStats) } : {}),
    ...(input.aboutTitle !== undefined ? { aboutTitle: input.aboutTitle } : {}),
    ...(input.aboutStory !== undefined ? { aboutStory: input.aboutStory } : {}),
    ...(input.showroomImages !== undefined
      ? { showroomImages: JSON.stringify(input.showroomImages) }
      : {}),
    ...(input.socialLinks !== undefined ? { socialLinks: JSON.stringify(input.socialLinks ?? {}) } : {}),
    ...(input.testimonialsEnabled !== undefined ? { testimonialsEnabled: input.testimonialsEnabled } : {}),
    ...(input.testimonials !== undefined ? { testimonials: JSON.stringify(input.testimonials) } : {}),
    ...(input.defaultSeoTitle !== undefined ? { defaultSeoTitle: input.defaultSeoTitle } : {}),
    ...(input.defaultSeoDescription !== undefined
      ? { defaultSeoDescription: input.defaultSeoDescription }
      : {}),
  };

  await db.siteSetting.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });

  return getSettings();
}
