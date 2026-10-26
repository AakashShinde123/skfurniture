/**
 * Database seed — creates the admin account, categories, a demo catalogue
 * and the site-settings row.
 *
 * Usage:  npm run seed
 * Idempotent: re-running updates defaults and skips existing rows.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Mirrors src/lib/env.ts defaults for standalone execution.
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "uploads";
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";
// NOTE: image references are stored as RELATIVE paths ("/api/media/…") so the
// catalogue works unchanged behind any domain or preview proxy. Only links
// that leave the page (WhatsApp messages, sitemap) absolutize server-side.

const SEED_SRC = path.join(process.cwd(), UPLOADS_DIR, "seed-src");

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Store a staged seed image through the same optimisation path as uploads. */
async function storeSeedImage(name: string, folder: string): Promise<string | null> {
  const source = path.join(SEED_SRC, `${name}.png`);
  if (!existsSync(source)) {
    console.warn(`  ! missing seed image: ${name}.png (skipping)`);
    return null;
  }

  const buffer = await sharp(readFileSync(source))
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const key = `${folder}/seed-${name}.webp`;
  const outPath = path.join(process.cwd(), UPLOADS_DIR, key);
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);

  await db.mediaAsset.upsert({
    where: { key },
    update: { size: buffer.length },
    create: {
      key,
      filename: `${name}.png`,
      mimeType: "image/webp",
      size: buffer.length,
      altText: null,
    },
  });

  return key;
}

// ---------------------------------------------------------------------------
// seed data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Sofas & Seating", description: "Sofas, sectionals, recliners and accent chairs for every living space." },
  { name: "Beds", description: "Solid wood beds with storage options, from single to king size." },
  { name: "Wardrobes", description: "Sliding and hinged wardrobes with smart internal layouts." },
  { name: "Dining Tables & Chairs", description: "Dining sets crafted for family meals and festive gatherings." },
  { name: "Living Room Furniture", description: "Coffee tables, TV units, display cabinets and more." },
  { name: "Office Furniture", description: "Desks, ergonomic chairs and storage for productive workdays." },
  { name: "Storage Furniture", description: "Bookshelves, sideboards and cabinets that cut the clutter." },
  { name: "Custom Furniture", description: "Made-to-order pieces built to your space and finish." },
];

interface SeedProduct {
  name: string;
  sku: string;
  category: string;
  shortDescription: string;
  description: string;
  price?: number;
  originalPrice?: number;
  dimensions?: { width?: number; depth?: number; height?: number };
  material: string;
  finish: string;
  colours: string[];
  availability?: "AVAILABLE" | "UNAVAILABLE" | "MADE_TO_ORDER";
  isFeatured?: boolean;
  status?: "DRAFT" | "PUBLISHED";
  image: string;
  deliveryInfo?: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Modern 3-Seater Fabric Sofa",
    sku: "SOF001",
    category: "Sofas & Seating",
    shortDescription: "Deep-seated 3-seater in stain-resistant fabric with solid sheesham legs.",
    description:
      "A generous three-seater designed for Indian living rooms. High-density foam cushions keep their shape for years, while the stain-resistant weave wipes clean with a damp cloth. Solid sheesham legs are bolted — not stapled — so the frame stays silent and sturdy.",
    price: 24999,
    originalPrice: 32999,
    dimensions: { width: 200, depth: 90, height: 85 },
    material: "Sheesham wood frame, premium polyester fabric",
    finish: "Walnut legs, warm grey upholstery",
    colours: ["Warm Grey", "Beige", "Teal"],
    isFeatured: true,
    image: "sofa-3seater",
    deliveryInfo: "Delivered fully assembled within 5–7 days. Free delivery across Mumbai.",
  },
  {
    name: "Solid Sheesham Queen Bed with Headboard",
    sku: "BED001",
    category: "Beds",
    shortDescription: "Queen bed in seasoned sheesham with a tall slatted headboard.",
    description:
      "Cut from government-certified plantation sheesham and kiln-seasoned to 8–12% moisture, this queen bed will not warp in monsoon humidity. The tall slatted headboard feels substantial without overpowering smaller bedrooms. Optional hydraulic under-bed storage keeps linens out of sight.",
    price: 34499,
    originalPrice: 41999,
    dimensions: { width: 150, depth: 200, height: 110 },
    material: "Solid sheesham wood",
    finish: "Honey teak, matte lacquer",
    colours: ["Honey Teak", "Walnut"],
    isFeatured: true,
    image: "bed-queen",
    deliveryInfo: "Knock-down design, assembled at your home in under 30 minutes.",
  },
  {
    name: "3-Door Sliding Wardrobe with Mirror",
    sku: "WRD001",
    category: "Wardrobes",
    shortDescription: "Spacious sliding wardrobe with full-length mirror and soft-close rails.",
    description:
      "Three sliding doors glide on German soft-close rails, so early risers never wake the house. Inside you get six shelves, a full-width hanging rod and a lockable drawer. The full-length mirror doubles the sense of space in compact rooms.",
    price: 45999,
    dimensions: { width: 180, depth: 60, height: 210 },
    material: "Engineered wood core with teak veneer",
    finish: "Teak matte with ivory laminate interior",
    colours: ["Teak", "Ivory & Teak"],
    image: "wardrobe-3door",
  },
  {
    name: "6-Seater Dining Table Set",
    sku: "DIN001",
    category: "Dining Tables & Chairs",
    shortDescription: "Solid mango wood table with six cushioned chairs — festive-proof.",
    description:
      "Built for Indian family dinners: a 40 mm solid mango top that shrugs off hot dishes on trivets, gently rounded corners for children, and six high-back chairs with easy-clean cushioned seats. The satin finish hides day-to-day scratches remarkably well.",
    price: 38999,
    originalPrice: 45999,
    dimensions: { width: 180, depth: 90, height: 76 },
    material: "Solid mango wood, high-resilience foam seats",
    finish: "Natural teak satin",
    colours: ["Natural Teak", "Dark Walnut"],
    isFeatured: true,
    image: "dining-6seater",
  },
  {
    name: "L-Shaped Sectional Sofa with Wooden Base",
    sku: "SOF002",
    category: "Sofas & Seating",
    shortDescription: "Corner-friendly sectional with reversible chaise and firm lumbar support.",
    description:
      "An L-shaped sectional that seats five comfortably without swallowing the room. The chaise can be reversed left or right during installation, and every cushion cover unzips for dry cleaning. Solid acacia base keeps the whole unit rock-steady.",
    price: 52999,
    originalPrice: 61999,
    dimensions: { width: 260, depth: 180, height: 82 },
    material: "Acacia wood base, premium woven fabric",
    finish: "Beige fabric, natural wood base",
    colours: ["Beige", "Charcoal"],
    image: "sofa-lshaped",
  },
  {
    name: "Coffee Table with Storage Shelf",
    sku: "LIV001",
    category: "Living Room Furniture",
    shortDescription: "Compact walnut coffee table with a full-width lower shelf.",
    description:
      "The coffee table that ends remote-control archaeology — a full-width lower shelf keeps magazines, chargers and board games reachable but invisible. Rounded corners protect shins, and the two-tone walnut top hides cup marks from evening chai.",
    price: 8999,
    dimensions: { width: 110, depth: 60, height: 45 },
    material: "Solid rubberwood",
    finish: "Two-tone walnut",
    colours: ["Walnut"],
    image: "coffee-table",
  },
  {
    name: "Walnut TV Unit for 65-inch Screens",
    sku: "LIV002",
    category: "Living Room Furniture",
    shortDescription: "Cable-managed TV console with two flap doors and open shelving.",
    description:
      "Fits screens up to 65 inches with dedicated cable cut-outs that keep the wall behind clean. Two soft-close flap doors hide set-top boxes, while the open shelf suits a soundbar and console. Wall-anchoring hardware is included for family safety.",
    price: 12499,
    dimensions: { width: 160, depth: 40, height: 50 },
    material: "Engineered wood with walnut melamine",
    finish: "Walnut matte",
    colours: ["Walnut", "Wenge"],
    image: "tv-unit",
  },
  {
    name: "Ergonomic High-Back Office Chair",
    sku: "OFF001",
    category: "Office Furniture",
    shortDescription: "Adjustable lumbar office chair with breathable mesh back.",
    description:
      "Designed for long work-from-home days: adjustable lumbar support, 4D armrests, breathable mesh back and a seat slider for different heights. The polished wooden armrest caps match the rest of your furniture instead of fighting it.",
    price: 9499,
    originalPrice: 11999,
    dimensions: { width: 65, depth: 65, height: 120 },
    material: "Nylon frame, mesh back, moulded foam seat",
    finish: "Charcoal mesh, teak armrest caps",
    colours: ["Charcoal"],
    availability: "UNAVAILABLE",
    image: "office-chair",
  },
  {
    name: "Study Desk with Drawer Pedestal",
    sku: "OFF002",
    category: "Office Furniture",
    shortDescription: "Compact study desk with three drawers and a cable management slot.",
    description:
      "A calm, clutter-free workspace in 120 cm. Three smooth-glide drawers swallow stationery and chargers, and a rear cable slot keeps the laptop setup tidy. Finished in low-sheen laminate that cleans with a dry cloth.",
    price: 11999,
    dimensions: { width: 120, depth: 55, height: 75 },
    material: "Engineered wood, metal legs",
    finish: "Ivory with oak accents",
    colours: ["Ivory & Oak"],
    image: "study-desk",
  },
  {
    name: "5-Shelf Solid Wood Bookshelf",
    sku: "STO001",
    category: "Storage Furniture",
    shortDescription: "Tall open bookshelf with anti-tip wall strap and adjustable shelves.",
    description:
      "Five shelves (two adjustable) in seasoned sheesham, engineered to carry heavy hardbacks without bowing. Ships with an anti-tip wall strap and a hidden wall-mount bracket — essential in homes with young climbers.",
    price: 10999,
    dimensions: { width: 80, depth: 32, height: 180 },
    material: "Solid sheesham wood",
    finish: "Honey teak matte",
    colours: ["Honey Teak", "Walnut"],
    isFeatured: true,
    image: "bookshelf",
  },
  {
    name: "Single Bed with Storage Drawers",
    sku: "BED002",
    category: "Beds",
    shortDescription: "Kids-and-guests single bed with two pull-out storage drawers.",
    description:
      "The practical single bed: two full-width drawers on castors swallow bedding, toys or guest luggage. Solid mango frame with rounded posts, finished in child-safe water-based lacquer. Heights are tuned so little legs climb in easily.",
    price: 18999,
    dimensions: { width: 100, depth: 195, height: 95 },
    material: "Solid mango wood",
    finish: "Natural, child-safe lacquer",
    colours: ["Natural"],
    status: "DRAFT",
    image: "bed-single",
  },
  {
    name: "Custom Modular Kitchen Cabinets",
    sku: "CUS001",
    category: "Custom Furniture",
    shortDescription: "Made-to-measure modular kitchen in wood and ivory laminate.",
    description:
      "We measure, design and build modular kitchen cabinetry to your exact wall dimensions — soft-close drawers, tandem baskets, and a choice of wood or high-gloss laminates. Price depends on layout, hardware and finishes; share your floor plan for a same-week quote.",
    availability: "MADE_TO_ORDER",
    material: "BWP-grade plywood, acrylic or laminate finish",
    finish: "Warm wood + ivory",
    colours: ["Wood & Ivory", "Charcoal & Wood"],
    image: "modular-kitchen",
  },
];

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function seedAdmin() {
  const bcryptjs = await import("bcryptjs");
  const passwordHash = await bcryptjs.hash(ADMIN_PASSWORD, 10);
  await db.adminUser.upsert({
    where: { username: ADMIN_USERNAME },
    update: { isActive: true },
    create: {
      username: ADMIN_USERNAME,
      name: "Shop Owner",
      passwordHash,
    },
  });
  console.log(`✓ admin "${ADMIN_USERNAME}" ready (password from SEED_ADMIN_PASSWORD)`);
}

async function seedSettings() {
  const heroKey = await storeSeedImage("hero-living", "banners");
  const showroomKeys = (
    await Promise.all([
      storeSeedImage("showroom-1", "showroom"),
      storeSeedImage("showroom-2", "showroom"),
      storeSeedImage("about-storefront", "showroom"),
    ])
  ).filter((key): key is string => Boolean(key));

  const defaults = {
    id: "default",
    shopName: "SK Furniture",
    tagline: "Timeless solid wood furniture, crafted in Mumbai since 1998",
    whatsappNumber: "919876543210",
    phone: "+91 98765 43210",
    email: "hello@skfurniture.in",
    address: "Shop 12, Furniture Market, MG Road, Mumbai, Maharashtra 400001",
    mapLink: "https://maps.google.com/?q=MG+Road+Furniture+Market+Mumbai",
    businessHours: "Mon – Sat: 10:00 AM – 8:30 PM\nSunday: 11:00 AM – 6:00 PM",
    serviceAreas: "Mumbai · Thane · Navi Mumbai · Pune (delivery)",
    announcementText: "Festive offer: flat 10% off on all dining sets — limited period only",
    heroHeadline: "Furniture That Turns a House Into a Home",
    heroSubtitle:
      "Handcrafted sofas, beds, wardrobes and dining sets — built from seasoned solid wood by artisans with 20+ years of experience. Visit our showroom or enquire directly on WhatsApp.",
    heroCtaText: "Explore Collection",
    heroCtaLink: "/catalogue",
    heroImageUrl: heroKey ?? null,
    heroStats: JSON.stringify([
      { value: "27+", label: "Years of craftsmanship" },
      { value: "6,000+", label: "Homes furnished" },
      { value: "100%", label: "Seasoned solid wood" },
      { value: "4.9★", label: "Customer rating" },
    ]),
    aboutTitle: "Craftsmanship You Can Feel",
    aboutStory:
      "SK Furniture began in 1998 as a two-carpenter workshop in Mumbai. Today, our 25-member team furnishes hundreds of homes across Maharashtra.\n\nWe build with seasoned sheesham, teak and mango wood — never particle board pretending to be more. Every piece passes three quality checks before delivery, and our artisans sign the furniture they build.\n\nVisit our 4,000 sq ft showroom to sink into the cushions and feel the grain for yourself, or send us your floor plan on WhatsApp and we will design furniture around your space.",
    showroomImages: JSON.stringify(showroomKeys),
    socialLinks: JSON.stringify({
      instagram: "https://instagram.com/skfurniture",
      facebook: "https://facebook.com/skfurniture",
      youtube: "",
    }),
    testimonialsEnabled: true,
    testimonials: JSON.stringify([
      {
        name: "Priya Deshmukh",
        area: "Powai, Mumbai",
        text: "Our dining set looks even better than the showroom photos. Delivery was on time and they assembled everything in 20 minutes.",
        rating: 5,
      },
      {
        name: "Rakesh Sharma",
        area: "Thane",
        text: "Ordered a custom wardrobe for an awkward corner. Their carpenter measured twice and the finish is flawless.",
        rating: 5,
      },
      {
        name: "Anjali Mehta",
        area: "Navi Mumbai",
        text: "Three years on, our sheesham bed still looks new. Genuine solid wood, no creaks at all.",
        rating: 4,
      },
    ]),
    defaultSeoTitle: "SK Furniture — Premium Solid Wood Furniture in Mumbai",
    defaultSeoDescription:
      "Buy sofas, beds, wardrobes, dining sets and custom solid wood furniture in Mumbai. Free delivery, 5-year workmanship warranty. Enquire on WhatsApp today.",
  };

  await db.siteSetting.upsert({
    where: { id: "default" },
    update: defaults,
    create: defaults,
  });
  console.log("✓ site settings seeded");
}

async function seedCategories() {
  for (const [index, category] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: slugify(category.name) },
      update: { description: category.description, sortOrder: index, isActive: true },
      create: { ...category, slug: slugify(category.name), sortOrder: index },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories seeded`);
}

async function seedProducts() {
  const categories = await db.category.findMany();
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  let created = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    const exists = await db.product.findUnique({ where: { sku: product.sku }, select: { id: true } });
    if (exists) {
      skipped += 1;
      continue;
    }

    const categoryId = categoryBySlug.get(slugify(product.category));
    if (!categoryId) {
      console.warn(`  ! category missing for ${product.name} — skipped`);
      skipped += 1;
      continue;
    }

    const imageKey = await storeSeedImage(product.image, "products");
    const slug = slugify(product.name);

    await db.product.create({
      data: {
        name: product.name,
        slug,
        sku: product.sku,
        categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price ?? null,
        originalPrice: product.originalPrice ?? null,
        dimensionWidth: product.dimensions?.width ?? null,
        dimensionDepth: product.dimensions?.depth ?? null,
        dimensionHeight: product.dimensions?.height ?? null,
        dimensionUnit: "cm",
        material: product.material,
        finish: product.finish,
        colours: JSON.stringify(product.colours),
        availability: product.availability ?? "AVAILABLE",
        deliveryInfo: product.deliveryInfo ?? null,
        isFeatured: product.isFeatured ?? false,
        status: product.status ?? "PUBLISHED",
        seoTitle: `${product.name} | Woodcraft Furniture House`,
        seoDescription: product.shortDescription,
        images: imageKey
          ? {
              create: {
                imageKey,
                altText: `${product.name} — ${product.finish}`,
                sortOrder: 0,
                isPrimary: true,
              },
            }
          : undefined,
      },
    });
    created += 1;
  }

  console.log(`✓ products seeded (created: ${created}, skipped: ${skipped})`);
}

async function main() {
  console.log("Seeding database…");
  await seedAdmin();
  await seedSettings();
  await seedCategories();
  await seedProducts();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
