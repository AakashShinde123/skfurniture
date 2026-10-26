/**
 * One-off rebrand: "Woodcraft Furniture House" → "SK Furniture".
 * Updates only copy/settings fields — images, products and categories stay.
 * Run with: npx tsx scripts/rebrand.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BRAND = {
  shopName: "SK Furniture",
  tagline: "Timeless solid wood furniture, crafted in Mumbai since 1998",
  email: "hello@skfurniture.in",
  announcementText: "Festive offer: flat 10% off on all dining sets — limited period only",
  heroHeadline: "Furniture That Turns a House Into a Home",
  heroSubtitle:
    "Handcrafted sofas, beds, wardrobes and dining sets — built from seasoned solid wood by artisans with 20+ years of experience. Visit our showroom or enquire directly on WhatsApp.",
  aboutTitle: "Craftsmanship You Can Feel",
  aboutStory:
    "SK Furniture began in 1998 as a two-carpenter workshop in Mumbai. Today, our 25-member team furnishes hundreds of homes across Maharashtra.\n\nWe build with seasoned sheesham, teak and mango wood — never particle board pretending to be more. Every piece passes three quality checks before delivery, and our artisans sign the furniture they build.\n\nVisit our 4,000 sq ft showroom to sink into the cushions and feel the grain for yourself, or send us your floor plan on WhatsApp and we will design furniture around your space.",
  socialLinks: JSON.stringify({
    instagram: "https://instagram.com/skfurniture",
    facebook: "https://facebook.com/skfurniture",
    youtube: "",
  }),
  defaultSeoTitle: "SK Furniture — Premium Solid Wood Furniture in Mumbai",
  defaultSeoDescription:
    "Buy sofas, beds, wardrobes, dining sets and custom solid wood furniture in Mumbai. Free delivery, 5-year workmanship warranty. Enquire on WhatsApp today.",
};

async function main() {
  const existing = await db.siteSetting.findUnique({ where: { id: "default" } });
  if (!existing) {
    console.error("✗ SiteSetting 'default' not found — run the main seed first.");
    process.exit(1);
  }

  await db.siteSetting.update({ where: { id: "default" }, data: BRAND });

  // Rename legacy brand mentions that may exist in product/category copy.
  const products = await db.product.findMany({
    where: { description: { contains: "Woodcraft" } },
    select: { id: true, description: true, shortDescription: true },
  });
  for (const product of products) {
    await db.product.update({
      where: { id: product.id },
      data: {
        description: product.description?.replaceAll("Woodcraft Furniture House", "SK Furniture"),
        shortDescription: product.shortDescription?.replaceAll("Woodcraft Furniture House", "SK Furniture"),
      },
    });
  }

  console.log("✓ Rebranded to SK Furniture");
  console.log(`  · settings updated, ${products.length} product description(s) cleaned`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
