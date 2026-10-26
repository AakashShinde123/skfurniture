import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listPublicProducts } from "@/services/product.service";
import { listCategories } from "@/services/category.service";

/** Regenerated per-request so newly published furniture is discoverable immediately. */
export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap — static pages plus every published product and active
 * category. Regenerated on request so newly published furniture is
 * discoverable by search engines immediately.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${env.siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${env.siteUrl}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${env.siteUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.siteUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [products, categories] = await Promise.all([
      listPublicProducts({ pageSize: 60 }),
      listCategories(),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${env.siteUrl}/catalogue?category=${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...products.items.map((product) => ({
        url: `${env.siteUrl}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Database not reachable (e.g. during a fresh deploy) — still emit static routes.
    return staticRoutes;
  }
}
